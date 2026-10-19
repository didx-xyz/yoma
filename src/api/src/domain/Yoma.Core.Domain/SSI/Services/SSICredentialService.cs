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
    private readonly ISSISchemaTypeService _ssiSchemaTypeService;
    private readonly ISSITenantCreationStatusService _ssiTenantCreationStatusService;
    private readonly IRepository<SSICredentialIssuance> _ssiCredentialIssuanceRepository;
    private readonly IRepository<SSITenantCreation> _ssiTenantCreationRepository;
    private readonly IRepositoryBatchedWithNavigationAndCustomFieldFilter<MyOpportunity.Models.MyOpportunity> _myOpportunityRepository;

    public const string CredentialAttribute_OfTypeList_Delimiter = ", ";
    #endregion

    #region Constructor
    public SSICredentialService(IOptions<AppSettings> appSettings,
        ISSISchemaService ssiSchemaService,
        ISSICredentialIssuanceStatusService ssiCredentialIssuanceStatusService,
        IRepository<SSICredentialIssuance> ssiCredentialIssuanceRepository,
        ISSISchemaTypeService ssiSchemaTypeService,
        ISSITenantCreationStatusService ssiTenantCreationStatusService,
        IRepository<SSITenantCreation> ssiTenantCreationRepository,
        IRepositoryBatchedWithNavigationAndCustomFieldFilter<MyOpportunity.Models.MyOpportunity> myOpportunityRepository)
    {
      _appSettings = appSettings.Value;
      _ssiSchemaService = ssiSchemaService;
      _ssiCredentialIssuanceStatusService = ssiCredentialIssuanceStatusService;
      _ssiCredentialIssuanceRepository = ssiCredentialIssuanceRepository;
      _ssiSchemaTypeService = ssiSchemaTypeService ?? throw new ArgumentNullException(nameof(ssiSchemaTypeService));
      _ssiTenantCreationStatusService = ssiTenantCreationStatusService ?? throw new ArgumentNullException(nameof(ssiTenantCreationStatusService));
      _ssiTenantCreationRepository = ssiTenantCreationRepository ?? throw new ArgumentNullException(nameof(ssiTenantCreationRepository));
      _myOpportunityRepository = myOpportunityRepository ?? throw new ArgumentNullException(nameof(myOpportunityRepository));
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
        StatusId = statusPendingId
      };

      switch (schema.Type)
      {
        case SchemaType.Opportunity:
          existingItem = _ssiCredentialIssuanceRepository.Query().SingleOrDefault(o => o.SchemaTypeId == item.SchemaTypeId && o.MyOpportunityId == entityId);
          item.MyOpportunityId = entityId;
          break;

        case SchemaType.YoID:
          existingItem = _ssiCredentialIssuanceRepository.Query().SingleOrDefault(o => o.SchemaTypeId == item.SchemaTypeId && o.UserId == entityId);
          item.UserId = entityId;
          break;
      }

      if (existingItem != null)
        throw new InvalidOperationException($"Credential issuance item already exists for schema type '{schema.Type}' and entity id '{entityId}'");

      await _ssiCredentialIssuanceRepository.Create(item);
    }

    /// <summary>
    /// Selects Pending work in modification order, filtering Opportunity tenant readiness in SQL before paging.
    /// Unready work stays Pending without a retry or timestamp change; already scheduled schema choices remain intact.
    /// </summary>
    public List<SSICredentialIssuance> ListPendingIssuanceSchedule(int batchSize, List<Guid> idsToSkip)
    {
      var credentialIssuanceStatusPendingId = _ssiCredentialIssuanceStatusService.GetByName(CredentialIssuanceStatus.Pending.ToString()).Id;

      var query = _ssiCredentialIssuanceRepository.Query().Where(o => o.StatusId == credentialIssuanceStatusPendingId);

      // Filter before paging/materialization: an old backlog without tenants must not consume
      // the batch/runtime budget ahead of issuable Opportunity credentials. Do not gate on today's
      // Opportunity status, issuance setting or selected schema; scheduling committed those choices.
      // YoID keeps its existing processing path and issuer lookup.
      var schemaTypeOpportunityId = _ssiSchemaTypeService.GetByName(SchemaType.Opportunity.ToString()).Id;
      var tenantStatusCreatedId = _ssiTenantCreationStatusService.GetByName(TenantCreationStatus.Created.ToString()).Id;
      var readyTenants = _ssiTenantCreationRepository.Query()
        .Where(tenant => tenant.StatusId == tenantStatusCreatedId && !string.IsNullOrEmpty(tenant.TenantId));
      var participations = _myOpportunityRepository.Query();
      var userEntityType = Entity.EntityType.User.ToString().ToLowerInvariant();
      var organizationEntityType = Entity.EntityType.Organization.ToString().ToLowerInvariant();

      query = query.Where(item => item.SchemaTypeId != schemaTypeOpportunityId
        || participations.Any(participation => participation.Id == item.MyOpportunityId
          && readyTenants.Any(tenant => tenant.EntityType.ToLower() == userEntityType && tenant.UserId == participation.UserId)
          && readyTenants.Any(tenant => tenant.EntityType.ToLower() == organizationEntityType && tenant.OrganizationId == participation.OrganizationId)));

      // A tenant can change after selection, or a provider attempt can fail. Do not retry an
      // already handled item again within this run; pending/error policy itself remains unchanged.
      if (idsToSkip != null && idsToSkip.Count != 0)
        query = query.Where(o => !idsToSkip.Contains(o.Id));

      var results = query
        .OrderBy(o => o.DateModified)
        .ThenBy(o => o.Id)
        .Take(batchSize)
        .ToList();

      return results;
    }

    public async Task UpdateScheduleIssuance(SSICredentialIssuance item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      item.CredentialId = item.CredentialId?.Trim();
      ArgumentException.ThrowIfNullOrWhiteSpace(item.SchemaName, nameof(item));
      item.SchemaName = item.SchemaName.Trim();
      item.SchemaVersion = item.SchemaVersion?.Trim();

      var statusId = _ssiCredentialIssuanceStatusService.GetByName(item.Status.ToString()).Id;
      item.StatusId = statusId;

      switch (item.Status)
      {
        case CredentialIssuanceStatus.Issued:
          if (string.IsNullOrEmpty(item.CredentialId))
            throw new ArgumentNullException(nameof(item), "Credential id required");
          if (string.IsNullOrEmpty(item.SchemaVersion))
            throw new ArgumentNullException(nameof(item), "Schema version required");
          item.ErrorReason = null;
          item.RetryCount = null;
          break;

        case CredentialIssuanceStatus.Error:
          if (string.IsNullOrEmpty(item.ErrorReason))
            throw new ArgumentNullException(nameof(item), "Error reason required");

          item.ErrorReason = item.ErrorReason?.Trim();
          // Version describes a successfully issued credential only. A retry resolves the latest version of the
          // schema name committed at scheduling.
          item.SchemaVersion = null;
          item.RetryCount = (byte?)(item.RetryCount + 1) ?? 0; //1st attempt not counted as a retry

          //retry attempts specified and exceeded (-1: infinite retries)
          if (_appSettings.SSIMaximumRetryAttempts == 0 || //no retries
            (_appSettings.SSIMaximumRetryAttempts > 0 && item.RetryCount > _appSettings.SSIMaximumRetryAttempts)) break;

          item.StatusId = _ssiCredentialIssuanceStatusService.GetByName(CredentialIssuanceStatus.Pending.ToString()).Id;
          item.Status = CredentialIssuanceStatus.Pending;
          break;

        default:
          throw new InvalidOperationException($"Status of '{item.Status}' not supported");
      }

      await _ssiCredentialIssuanceRepository.Update(item);
    }
    #endregion
  }
}
