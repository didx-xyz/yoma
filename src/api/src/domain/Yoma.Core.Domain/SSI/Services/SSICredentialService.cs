using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Services
{
  public class SSICredentialService : ISSICredentialService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly ISSISchemaService _ssiSchemaService;
    private readonly ISSICredentialIssuanceStatusService _ssiCredentialIssuanceStatusService;
    private readonly IRepository<SSICredentialIssuance> _ssiCredentialIssuanceRepository;

    public const string CredentialAttribute_OfTypeList_Delimiter = ", ";
    #endregion

    #region Constructor
    public SSICredentialService(IOptions<AppSettings> appSettings,
        ISSISchemaService ssiSchemaService,
        ISSICredentialIssuanceStatusService ssiCredentialIssuanceStatusService,
        IRepository<SSICredentialIssuance> ssiCredentialIssuanceRepository)
    {
      _appSettings = appSettings.Value;
      _ssiSchemaService = ssiSchemaService;
      _ssiCredentialIssuanceStatusService = ssiCredentialIssuanceStatusService;
      _ssiCredentialIssuanceRepository = ssiCredentialIssuanceRepository;
    }
    #endregion

    #region Public Members
    public async Task ScheduleIssuance(string schemaName, Guid entityId)
    {
      var schema = await _ssiSchemaService.GetByFullName(schemaName);

      if (entityId == Guid.Empty)
        throw new ArgumentNullException(nameof(entityId));

      var statusPendingId = _ssiCredentialIssuanceStatusService.GetByName(CredentialIssuanceStatus.Pending.ToString()).Id;

      SSICredentialIssuance? existingItem = null;
      var item = new SSICredentialIssuance
      {
        SchemaTypeId = schema.TypeId,
        ArtifactType = schema.ArtifactType,
        SchemaName = schema.Name,
        SchemaVersion = schema.Version,
        StatusId = statusPendingId
      };

      switch (schema.Type)
      {
        case SchemaType.Opportunity:
          existingItem = _ssiCredentialIssuanceRepository.Query().SingleOrDefault(o => o.SchemaTypeId == item.SchemaTypeId && o.MyOpportunityId == entityId);
          item.MyOpportunityId = entityId;
          break;

        case SchemaType.YoID:
          existingItem = _ssiCredentialIssuanceRepository.Query().SingleOrDefault(o => o.SchemaTypeId == item.SchemaTypeId && o.OrganizationId == entityId);
          item.UserId = entityId;
          break;
      }

      if (existingItem != null)
        throw new InvalidOperationException($"Credential issuance item already exists for schema type '{schema.Type}' and entity id '{entityId}'");

      await _ssiCredentialIssuanceRepository.Create(item);
    }

    public List<SSICredentialIssuance> ListPendingIssuanceSchedule(int batchSize, List<Guid> idsToSkip)
    {
      var credentialIssuanceStatusPendingId = _ssiCredentialIssuanceStatusService.GetByName(CredentialIssuanceStatus.Pending.ToString()).Id;

      var query = _ssiCredentialIssuanceRepository.Query().Where(o => o.StatusId == credentialIssuanceStatusPendingId);

      // skipped if tenants were not created (see SSIBackgroundService)
      if (idsToSkip != null && idsToSkip.Count != 0)
        query = query.Where(o => !idsToSkip.Contains(o.Id));

      var results = query.OrderBy(o => o.DateModified).Take(batchSize).ToList();

      return results;
    }

    public async Task UpdateScheduleIssuance(SSICredentialIssuance item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      item.CredentialId = item.CredentialId?.Trim();

      var statusId = _ssiCredentialIssuanceStatusService.GetByName(item.Status.ToString()).Id;
      item.StatusId = statusId;

      switch (item.Status)
      {
        case CredentialIssuanceStatus.Issued:
          if (string.IsNullOrEmpty(item.CredentialId))
            throw new ArgumentNullException(nameof(item), "Credential id required");
          item.ErrorReason = null;
          item.RetryCount = null;
          break;

        case CredentialIssuanceStatus.Error:
          if (string.IsNullOrEmpty(item.ErrorReason))
            throw new ArgumentNullException(nameof(item), "Error reason required");

          item.ErrorReason = item.ErrorReason?.Trim();
          item.RetryCount = (byte?)(item.RetryCount + 1) ?? 0; //1st attempt not counted as a retry

          //retry attempts specified and exceeded
          if (_appSettings.SSIMaximumRetryAttempts > 0 && item.RetryCount > _appSettings.SSIMaximumRetryAttempts) break;

          item.StatusId = _ssiCredentialIssuanceStatusService.GetByName(CredentialIssuanceStatus.Pending.ToString()).Id;
          break;

        default:
          throw new InvalidOperationException($"Status of '{item.Status}' not supported");
      }

      await _ssiCredentialIssuanceRepository.Update(item);
    }
    #endregion
  }
}

