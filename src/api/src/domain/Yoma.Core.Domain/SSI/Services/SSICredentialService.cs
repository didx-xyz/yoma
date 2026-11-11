using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Services
{
  public class SSICredentialService : ISSICredentialService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IExecutionStrategyService _executionStrategyService;
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
        IRepositoryBatchedWithNavigationAndCustomFieldFilter<MyOpportunity.Models.MyOpportunity> myOpportunityRepository,
        IExecutionStrategyService executionStrategyService)
    {
      _appSettings = appSettings.Value;
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
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
      if (!SSISSchemaHelper.ArtifactTypeSupported(schema.Type, schema.ArtifactType))
        throw new InvalidOperationException($"Artifact type '{schema.ArtifactType}' is not supported for schema type '{schema.Type}'");

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
          existingItem = _ssiCredentialIssuanceRepository.Query().SingleOrDefault(o => o.SchemaTypeId == item.SchemaTypeId && o.UserId == entityId && o.ParentId == null);
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
      // A replacement cannot issue until its predecessor has been confirmed revoked.
      query = query.Where(item => item.ParentId == null || _ssiCredentialIssuanceRepository.Query()
        .Any(parent => parent.Id == item.ParentId && parent.DateRevoked != null));

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

#pragma warning disable CA1862 // Query provider does not translate StringComparison overloads
      query = query.Where(item => item.SchemaTypeId != schemaTypeOpportunityId
        || participations.Any(participation => participation.Id == item.MyOpportunityId
          && readyTenants.Any(tenant => tenant.EntityType.ToLower() == userEntityType && tenant.UserId == participation.UserId)
          && readyTenants.Any(tenant => tenant.EntityType.ToLower() == organizationEntityType && tenant.OrganizationId == participation.OrganizationId)));
#pragma warning restore CA1862

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
      ArgumentNullException.ThrowIfNull(item);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        var persisted = _ssiCredentialIssuanceRepository.Query(LockMode.Wait).Single(value => value.Id == item.Id);

        switch (item.Status)
        {
          case CredentialIssuanceStatus.Error:
            if (persisted.Status == CredentialIssuanceStatus.Deleted ||
              (persisted.Status == CredentialIssuanceStatus.Issued && persisted.DateRefreshRequested == null && persisted.CredentialId == item.CredentialId))
            {
              scope.Complete();
              return; // Commit acknowledgement was lost after the work completed.
            }
            break;

          case CredentialIssuanceStatus.Issued:
            if (persisted.Status == CredentialIssuanceStatus.Reissue && persisted.CredentialId == item.CredentialId)
            {
              scope.Complete();
              return; // Issuance was saved and a profile change already queued its comparison.
            }

            if (persisted.Status is not (CredentialIssuanceStatus.Pending or CredentialIssuanceStatus.Issued))
              throw new InvalidOperationException("An old issuance response cannot overwrite credential retirement");
            break;

          case CredentialIssuanceStatus.Revoked:
            if (persisted.Status is not (CredentialIssuanceStatus.Revoke or CredentialIssuanceStatus.Revoked))
              throw new InvalidOperationException("Revocation was not requested");
            break;

          case CredentialIssuanceStatus.Deleted:
            if (persisted.Status is not (CredentialIssuanceStatus.Revoked or CredentialIssuanceStatus.Deleted))
              throw new InvalidOperationException("Revocation must precede wallet cleanup");
            break;

          case CredentialIssuanceStatus.Pending:
          case CredentialIssuanceStatus.Replay:
            break;

          case CredentialIssuanceStatus.Reissue:
          case CredentialIssuanceStatus.Revoke:
            throw new NotSupportedException("Revocation must be scheduled through reissuance processing");

          default:
            throw new NotSupportedException($"Credential issuance status '{item.Status}' is not supported");
        }

        // Profile requests can arrive while remote issuance is running. Never overwrite that marker.
        item.DateRefreshRequested = persisted.DateRefreshRequested;

        await UpdateScheduleIssuanceCore(item, persisted);

        scope.Complete();
      }, true);
    }

    /// <summary>
    /// Schedule credential reissuance following a profile change.
    /// </summary>
    public async Task ScheduleReissuance(Guid userId)
    {
      if (userId == Guid.Empty) throw new ArgumentNullException(nameof(userId));

      var typeId = _ssiSchemaTypeService.GetByName(nameof(SchemaType.YoID)).Id;

      using var scope = TransactionScopeHelper.CreateReadCommitted();

      var root = _ssiCredentialIssuanceRepository.Query(LockMode.Wait)
        .SingleOrDefault(item => item.SchemaTypeId == typeId && item.UserId == userId && item.ParentId == null);

      if (root == null)
      {
        scope.Complete();
        return; // Not onboarded yet; leave the surrounding profile transaction intact.
      }

      var item = _ssiCredentialIssuanceRepository.Query(LockMode.Wait)
        .Where(item => item.SchemaTypeId == typeId && item.UserId == userId)
        .Single(item => !_ssiCredentialIssuanceRepository.Query().Any(child => child.ParentId == item.Id));

      switch (item.Status)
      {
        case CredentialIssuanceStatus.Issued:
        case CredentialIssuanceStatus.Reissue:
          item.Status = CredentialIssuanceStatus.Reissue;
          item.StatusId = _ssiCredentialIssuanceStatusService.GetByName(item.Status.ToString()).Id;
          item.DateRefreshRequested = DateTimeOffset.UtcNow;
          await _ssiCredentialIssuanceRepository.Update(item);
          break;

        case CredentialIssuanceStatus.Pending:
        case CredentialIssuanceStatus.Replay:
          item.DateRefreshRequested = DateTimeOffset.UtcNow;
          await _ssiCredentialIssuanceRepository.Update(item);
          break;

        case CredentialIssuanceStatus.Error:
        case CredentialIssuanceStatus.Revoke:
        case CredentialIssuanceStatus.Revoked:
        case CredentialIssuanceStatus.Deleted:
          break;

        default:
          throw new NotSupportedException($"Credential issuance status '{item.Status}' is not supported");
      }

      scope.Complete();
    }

    /// <summary>
    /// Process credential reissuance based on whether the issued attribute values have changed.
    /// </summary>
    public async Task ProcessReissuance(SSICredentialIssuance item, bool changed)
    {
      ArgumentNullException.ThrowIfNull(item);

      if (item.SchemaType != SchemaType.YoID || !item.UserId.HasValue)
        throw new InvalidOperationException("Only YoID credentials can be replaced after a profile change");

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        _ = _ssiCredentialIssuanceRepository.Query(LockMode.Wait)
          .Single(value => value.SchemaTypeId == item.SchemaTypeId && value.UserId == item.UserId && value.ParentId == null);

        var current = _ssiCredentialIssuanceRepository.Query(LockMode.Wait).Single(value => value.Id == item.Id);

        switch (current.Status)
        {
          case CredentialIssuanceStatus.Reissue:
            break;

          case CredentialIssuanceStatus.Issued:
          case CredentialIssuanceStatus.Pending:
          case CredentialIssuanceStatus.Error:
          case CredentialIssuanceStatus.Replay:
          case CredentialIssuanceStatus.Revoke:
          case CredentialIssuanceStatus.Revoked:
          case CredentialIssuanceStatus.Deleted:
            return; // The schedule has moved on since the comparison started.

          default:
            throw new NotSupportedException($"Credential issuance status '{current.Status}' is not supported");
        }

        if (current.DateRefreshRequested != item.DateRefreshRequested)
          return; // A newer profile change must be checked against its own snapshot.

        current.DateRefreshRequested = null;
        current.ErrorReason = null;
        current.RetryCount = null;
        current.Status = changed ? CredentialIssuanceStatus.Revoke : CredentialIssuanceStatus.Issued;
        current.StatusId = _ssiCredentialIssuanceStatusService.GetByName(current.Status.ToString()).Id;

        if (changed)
        {
          await _ssiCredentialIssuanceRepository.Create(new SSICredentialIssuance
          {
            ParentId = current.Id,
            SchemaTypeId = current.SchemaTypeId,
            SchemaType = SchemaType.YoID,
            SchemaName = _appSettings.SSISchemaFullNameYoID,
            ArtifactType = current.ArtifactType,
            UserId = current.UserId,
            Status = CredentialIssuanceStatus.Pending,
            StatusId = _ssiCredentialIssuanceStatusService.GetByName(nameof(CredentialIssuanceStatus.Pending)).Id
          });
        }

        await _ssiCredentialIssuanceRepository.Update(current);

        scope.Complete();

        item.Status = current.Status;
      }, true);
    }

    public List<SSICredentialIssuance> ListPendingReissuanceSchedule(int batchSize, List<Guid> idsToSkip)
    {
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(batchSize, 0);

      var typeId = _ssiSchemaTypeService.GetByName(nameof(SchemaType.YoID)).Id;
      var reissueId = _ssiCredentialIssuanceStatusService.GetByName(nameof(CredentialIssuanceStatus.Reissue)).Id;
      var revokeId = _ssiCredentialIssuanceStatusService.GetByName(nameof(CredentialIssuanceStatus.Revoke)).Id;
      var revokedId = _ssiCredentialIssuanceStatusService.GetByName(nameof(CredentialIssuanceStatus.Revoked)).Id;

      return
      [
        .. _ssiCredentialIssuanceRepository.Query()
          .Where(item => item.SchemaTypeId == typeId && !idsToSkip.Contains(item.Id))
          .Where(item => item.StatusId == reissueId || item.StatusId == revokeId || item.StatusId == revokedId)
          // Retain the revoked wallet copy until its replacement has been issued.
          .Where(item => item.StatusId != revokedId || _ssiCredentialIssuanceRepository.Query()
            .Any(child => child.ParentId == item.Id && child.DateIssued != null))
          .OrderBy(item => item.DateModified)
          .ThenBy(item => item.Id)
          .Take(batchSize)
      ];
    }

    public List<SSICredentialIssuance> ListReplayIssuanceSchedule(int batchSize, List<Guid> idsToSkip)
    {
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(batchSize, default, nameof(batchSize));

      var statusId = _ssiCredentialIssuanceStatusService.GetByName(CredentialIssuanceStatus.Replay.ToString()).Id;
      var query = _ssiCredentialIssuanceRepository.Query().Where(item => item.StatusId == statusId);
      if (idsToSkip != null && idsToSkip.Count != 0)
        query = query.Where(item => !idsToSkip.Contains(item.Id));

      return [.. query
        .OrderBy(item => item.DateModified)
        .ThenBy(item => item.Id)
        .Take(batchSize)];
    }

    #endregion

    #region Private Members
    private async Task UpdateScheduleIssuanceCore(SSICredentialIssuance item, SSICredentialIssuance persisted)
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
        case CredentialIssuanceStatus.Replay:
        case CredentialIssuanceStatus.Pending:
          // Only a deliberately migrated Replay row can checkpoint cleanup or return to Pending.
          // In particular, ordinary error handling must never turn a cleanup failure into issuance.
          if (item.Status == CredentialIssuanceStatus.Pending && persisted.Status == CredentialIssuanceStatus.Pending
            && persisted.CredentialId == null && persisted.SchemaVersion == null && persisted.ErrorReason == null
            && persisted.RetryCount == null && persisted.DateIssued == item.DateIssued)
            return; // Commit acknowledgement can fail after successful cleanup; do not repeat its state change.

          if (persisted.Status != CredentialIssuanceStatus.Replay)
            throw new InvalidOperationException($"Replay expected for credential issuance item '{item.Id}'");

          if (item.Status == CredentialIssuanceStatus.Pending)
          {
            item.CredentialId = null;
            item.SchemaVersion = null;
            item.ErrorReason = null;
            item.RetryCount = null;
          }
          break;

        case CredentialIssuanceStatus.Revoked:
          if (item.DateRevoked == null) throw new InvalidOperationException("Confirmed revocation date required");

          item.ErrorReason = null;
          item.RetryCount = null;
          break;

        case CredentialIssuanceStatus.Deleted:
          if (item.DateRevoked == null || item.DateDeleted == null)
            throw new InvalidOperationException("Confirmed revocation and deletion dates required");

          item.ErrorReason = null;
          item.RetryCount = null;
          break;

        case CredentialIssuanceStatus.Issued:
          if (string.IsNullOrEmpty(item.CredentialId))
            throw new ArgumentNullException(nameof(item), "Credential id required");
          if (string.IsNullOrEmpty(item.SchemaVersion))
            throw new ArgumentNullException(nameof(item), "Schema version required");
          item.ErrorReason = null;
          item.RetryCount = null;

          if (item.DateRefreshRequested != null)
          {
            item.Status = CredentialIssuanceStatus.Reissue;
            item.StatusId = _ssiCredentialIssuanceStatusService.GetByName(item.Status.ToString()).Id;
          }
          break;

        case CredentialIssuanceStatus.Error:
          if (string.IsNullOrEmpty(item.ErrorReason))
            throw new ArgumentNullException(nameof(item), "Error reason required");

          item.ErrorReason = item.ErrorReason?.Trim();
          item.DateRevoked = persisted.DateRevoked;
          item.DateDeleted = persisted.DateDeleted;

          CredentialIssuanceStatus retryStatus;
          switch (persisted.Status)
          {
            case CredentialIssuanceStatus.Reissue:
            case CredentialIssuanceStatus.Replay:
            case CredentialIssuanceStatus.Revoke:
            case CredentialIssuanceStatus.Revoked:
              retryStatus = persisted.Status;
              break;

            case CredentialIssuanceStatus.Issued:
            case CredentialIssuanceStatus.Pending:
            case CredentialIssuanceStatus.Error:
              retryStatus = CredentialIssuanceStatus.Pending;
              break;

            case CredentialIssuanceStatus.Deleted:
              return; // Cleanup is complete; a late failure cannot restart issuance.

            default:
              throw new NotSupportedException($"Credential issuance status '{persisted.Status}' is not supported");
          }

          // Cleanup retries retain the old credential/version; only successful cleanup permits Pending.
          // Ordinary issuance retries resolve the latest version of the scheduled schema name.
          if (retryStatus == CredentialIssuanceStatus.Pending) item.SchemaVersion = null;

          item.RetryCount = persisted.RetryCount;
          item.RetryCount = (byte?)(item.RetryCount + 1) ?? 0; //1st attempt not counted as a retry

          //retry attempts specified and exceeded (-1: infinite retries)
          if (_appSettings.SSIMaximumRetryAttempts == 0 || //no retries
            (_appSettings.SSIMaximumRetryAttempts > 0 && item.RetryCount > _appSettings.SSIMaximumRetryAttempts)) break;

          item.StatusId = _ssiCredentialIssuanceStatusService.GetByName(retryStatus.ToString()).Id;
          item.Status = retryStatus;
          break;

        case CredentialIssuanceStatus.Reissue:
        case CredentialIssuanceStatus.Revoke:
          throw new NotSupportedException("Revocation must be scheduled through reissuance processing");

        default:
          throw new NotSupportedException($"Status of '{item.Status}' not supported");
      }

      await _ssiCredentialIssuanceRepository.Update(item);
    }

    #endregion
  }
}
