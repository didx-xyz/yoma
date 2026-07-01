using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Services
{
  public class SyncStateService : ISyncStateService
  {
    #region Class Variables
    private readonly IPartnerService _partnerService;
    private readonly IProcessingStatusService _processingStatusService;
    private readonly IProcessingHelperService _processingHelperService;
    private readonly IRepositoryBatched<ProcessingLog> _processingLogRepository;
    private readonly IRepository<PartnerUser> _partnerUserRepository;
    #endregion

    #region Constructor
    public SyncStateService(
      IProcessingStatusService processingStatusService,
      IProcessingHelperService processingHelperService,
      IRepositoryBatched<ProcessingLog> processingLogRepository,
      IPartnerService partnerService,
      IRepository<PartnerUser> partnerUserRepository)
    {
      _processingStatusService = processingStatusService;
      _processingHelperService = processingHelperService;
      _processingLogRepository = processingLogRepository;
      _partnerService = partnerService;
      _partnerUserRepository = partnerUserRepository;
    }
    #endregion

    #region Public Members
    public SyncInfoEntity? ListSyncInfo(EntityType entityType, Guid entityId, string? url)
    {
      var statusAbortedId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;

      var query = _processingLogRepository.Query()
        .Where(o => o.EntityType == entityType.ToString() && o.StatusId != statusAbortedId);

      query = entityType switch
      {
        EntityType.Opportunity => query.Where(o => o.OpportunityId == entityId),
        _ => throw new InvalidOperationException($"Entity type '{entityType}' not supported")
      };

      var items = query
        .OrderByDescending(o => o.DateModified)
        .ToList()
        .GroupBy(o => new { o.SyncType, o.PartnerId })
        .Select(g => g.First())
        .ToList();

      if (items.Count == 0) return null;

      var syncTypes = items
        .Select(o => Enum.Parse<SyncType>(o.SyncType, true))
        .Distinct()
        .ToList();

      if (syncTypes.Count > 1)
        throw new DataInconsistencyException($"Entity '{entityId}' of type '{entityType}' has mixed synchronization types recorded in processing logs");

      var syncType = syncTypes.Single();

      var partners = items
        .Select(o => ToSyncInfoEntityPartner(o, url))
        .DistinctBy(o => new { o.Partner, o.ExternalId })
        .ToList();

      if (syncType == SyncType.Pull && partners.Count != 1)
        throw new DataInconsistencyException($"Pull synchronization requires exactly one partner for entity '{entityId}' of type '{entityType}'");

      return new SyncInfoEntity
      {
        SyncType = syncType,
        Partners = partners
      };
    }

    public SyncInfoMyOpportunity? ListSyncInfoMyOpportunity(Guid myOpportunityId)
    {
      if (myOpportunityId == Guid.Empty)
        throw new ArgumentNullException(nameof(myOpportunityId));

      var statusAbortedId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;

      var items = _processingLogRepository.Query()
        .Where(o => o.EntityType == EntityType.MyOpportunity.ToString()
          && o.MyOpportunityId == myOpportunityId
          && o.StatusId != statusAbortedId)
        .OrderByDescending(o => o.DateModified)
        .ToList()
        .GroupBy(o => new { o.SyncType, o.PartnerId })
        .Select(g => g.First())
        .ToList();

      if (items.Count == 0) return null;

      var syncTypes = items
        .Select(o => Enum.Parse<SyncType>(o.SyncType, true))
        .Distinct()
        .ToList();

      if (syncTypes.Count > 1)
        throw new DataInconsistencyException($"MyOpportunity '{myOpportunityId}' has mixed synchronization types recorded in processing logs");

      var syncType = syncTypes.Single();

      if (syncType != SyncType.Pull)
        throw new DataInconsistencyException($"MyOpportunity synchronization only supports pull synchronization for entity '{myOpportunityId}'");

      var partners = items
        .Select(ToSyncInfoMyOpportunityPartner)
        .DistinctBy(o => new { o.Partner, o.ExternalId })
        .ToList();

      if (partners.Count != 1)
        throw new DataInconsistencyException($"MyOpportunity pull synchronization requires exactly one partner for entity '{myOpportunityId}'");

      return new SyncInfoMyOpportunity
      {
        SyncType = syncType,
        Partners = partners
      };
    }

    public SyncInfoUser? ListUserSyncInfo(Guid userId)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      var items = _partnerUserRepository.Query()
        .Where(o => o.UserId == userId)
        .ToList();

      if (items.Count == 0) return null;

      return new SyncInfoUser
      {
        Partners = [.. items.Select(ToSyncInfoUserPartner)]
      };
    }

    public SyncInfoUserPartner? GetUserSyncInfo(Guid userId, SyncPartner partner)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      var partnerModel = _partnerService.GetByName(partner.ToString());

      var item = _partnerUserRepository.Query()
        .SingleOrDefault(o => o.UserId == userId && o.PartnerId == partnerModel.Id);

      return item == null ? null : ToSyncInfoUserPartner(item);
    }

    public async Task UpsertUserSyncInfo(
      Guid userId,
      string username,
      string? email,
      string? phoneNumber,
      SyncInfoUserPartner syncInfo)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      if (string.IsNullOrWhiteSpace(username))
        throw new ArgumentNullException(nameof(username));

      ArgumentNullException.ThrowIfNull(syncInfo);

      username = username.Trim();
      email = email?.Trim();
      phoneNumber = phoneNumber?.Trim();
      syncInfo.ExternalId = syncInfo.ExternalId?.Trim();

      var partner = _partnerService.GetByName(syncInfo.Partner.ToString());

      var item = _partnerUserRepository.Query()
        .SingleOrDefault(o => o.UserId == userId && o.PartnerId == partner.Id);

      if (item == null)
      {
        item = new PartnerUser
        {
          PartnerId = partner.Id,
          Partner = syncInfo.Partner,
          UserId = userId,
          Username = username,
          Email = email,
          PhoneNumber = phoneNumber,
          ExternalId = syncInfo.ExternalId,
          DateLastRedirect = syncInfo.DateLastRedirect
        };

        await _partnerUserRepository.Create(item);
        return;
      }

      item.Username = username;
      item.Email = email;
      item.PhoneNumber = phoneNumber;
      item.ExternalId = syncInfo.ExternalId;
      item.DateLastRedirect = syncInfo.DateLastRedirect;

      await _partnerUserRepository.Update(item);
    }

    public async Task<bool> AbortSyncPushCreateIfPossible(EntityType entityType, Guid entityId)
    {
      var item = _processingHelperService.GetByEntityLatest(SyncType.Push, entityType, entityId);
      if (item == null) return false;

      var action = Enum.Parse<SyncAction>(item.Action, true);
      if (action != SyncAction.Create) return false;
      if (item.Status == ProcessingStatus.Processed) return false;

      item.StatusId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;
      item.Status = ProcessingStatus.Aborted;

      await _processingLogRepository.Update(item);

      return true;
    }
    #endregion

    #region Private Members
    private static SyncInfoEntityPartner ToSyncInfoEntityPartner(ProcessingLog item, string? url)
    {
      ArgumentNullException.ThrowIfNull(item);

      return new SyncInfoEntityPartner
      {
        Partner = item.Partner,
        EntityType = Enum.Parse<EntityType>(item.EntityType, true),
        ExternalId = item.EntityExternalId,
        URL = url
      };
    }

    private static SyncInfoMyOpportunityPartner ToSyncInfoMyOpportunityPartner(ProcessingLog item)
    {
      ArgumentNullException.ThrowIfNull(item);

      return new SyncInfoMyOpportunityPartner
      {
        Partner = item.Partner,
        EntityType = Enum.Parse<EntityType>(item.EntityType, true),
        ExternalId = item.EntityExternalId
      };
    }

    private static SyncInfoUserPartner ToSyncInfoUserPartner(PartnerUser item)
    {
      ArgumentNullException.ThrowIfNull(item);

      return new SyncInfoUserPartner
      {
        Partner = item.Partner,
        ExternalId = item.ExternalId,
        DateLastRedirect = item.DateLastRedirect
      };
    }

    #endregion
  }
}
