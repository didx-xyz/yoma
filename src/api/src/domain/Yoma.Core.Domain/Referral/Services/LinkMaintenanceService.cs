using Microsoft.Extensions.Logging;
using System.Transactions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class LinkMaintenanceService : ILinkMaintenanceService
  {
    #region Class Variables
    private readonly ILinkStatusService _linkStatusService;
    private readonly ILinkUsageStatusService _linkUsageStatusService;

    private readonly IExecutionStrategyService _executionStrategyService;

    private readonly IRepositoryBatchedValueContainsWithNavigation<ReferralLink> _linkRepository;
    private readonly IRepositoryBatched<ReferralLinkUsage> _linkUsageRepository;

    private static readonly ReferralLinkStatus[] Statuses_Link_Expirable = [ReferralLinkStatus.Active];
    #endregion

    #region Constructor
    public LinkMaintenanceService(
      ILinkStatusService linkStatusService,
      ILinkUsageStatusService linkUsageStatusService,

      IExecutionStrategyService executionStrategyService, 

      IRepositoryBatchedValueContainsWithNavigation<ReferralLink> linkRepository,
      IRepositoryBatched<ReferralLinkUsage> linkUsageRepository)
    {
      _linkStatusService = linkStatusService ?? throw new ArgumentNullException(nameof(linkStatusService));
      _linkUsageStatusService = linkUsageStatusService ?? throw new ArgumentNullException(nameof(linkUsageStatusService));

      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));

      _linkRepository = linkRepository ?? throw new ArgumentNullException(nameof(linkRepository));
      _linkUsageRepository = linkUsageRepository ?? throw new ArgumentNullException(nameof(linkUsageRepository));
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Action upon referrer blocking: optionally cancel all active links associated with the user
    /// </summary>
    public async Task CancelByUserId(Guid userId)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      var statusActiveId = _linkStatusService.GetByName(ReferralLinkStatus.Active.ToString()).Id;
      var statusCancelledId = _linkStatusService.GetByName(ReferralLinkStatus.Cancelled.ToString()).Id;

      var items = _linkRepository.Query()
        .Where(o => o.UserId == userId && o.StatusId == statusActiveId)
        .ToList();

      items.ForEach(o =>
      {
        o.StatusId = statusCancelledId;
        o.Status = ReferralLinkStatus.Cancelled;
      });

      await _linkRepository.Update(items);
    }

    /// <summary>
    /// Action upon program deletion: cancel all active links associated with the program
    /// </summary>
    public async Task CancelByProgramId(Guid programId)
    {
      if (programId == Guid.Empty)
        throw new ArgumentNullException(nameof(programId));

      var statusActiveId = _linkStatusService.GetByName(ReferralLinkStatus.Active.ToString()).Id;
      var statusCancelledId = _linkStatusService.GetByName(ReferralLinkStatus.Cancelled.ToString()).Id;

      var items = _linkRepository.Query()
        .Where(o => o.ProgramId == programId && o.StatusId == statusActiveId)
        .ToList();

      items.ForEach(o =>
      {
        o.StatusId = statusCancelledId;
        o.Status = ReferralLinkStatus.Cancelled;
      });

      await _linkRepository.Update(items);
    }

    /// <summary>
    /// Action upon program expiration: expire all active links and usages associated with the program
    /// </summary>
    public async Task ExpireByProgramId(List<Guid> programIds, ILogger? logger = null)
    {
      if (programIds == null || programIds.Count == 0 || programIds.Any(o => o == Guid.Empty))
        throw new ArgumentNullException(nameof(programIds));
      programIds = [.. programIds.Distinct()];

      var statusExpiredId = _linkStatusService.GetByName(ReferralLinkStatus.Expired.ToString()).Id;
      var statusExpirableIds = Statuses_Link_Expirable.Select(o => _linkStatusService.GetByName(o.ToString()).Id).ToList();

      var items = _linkRepository.Query()
        .Where(o => programIds.Contains(o.ProgramId) && statusExpirableIds.Contains(o.StatusId))
        .ToList();

      if (items.Count == 0)
      {
        logger?.LogInformation("No expirable links found for the requested programs");
        return;
      }

      items.ForEach(o =>
      {
        o.StatusId = statusExpiredId;
        o.Status = ReferralLinkStatus.Expired;

        logger?.LogInformation("Link with id '{id}' flagged for expiration", o.Id);
      });

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

        var linkIds = items.Select(o => o.Id).Distinct().ToList();

        await _linkRepository.Update(items);
        await ExpireLinkUsagesByLinkId(linkIds, logger);

        scope.Complete();
      });
    }
    #endregion

    private async Task ExpireLinkUsagesByLinkId(List<Guid> linkIds, ILogger? logger = null)
    {
      if (linkIds == null || linkIds.Count == 0 || linkIds.Any(o => o == Guid.Empty))
        throw new ArgumentNullException(nameof(linkIds));
      linkIds = [.. linkIds.Distinct()];

      var statusExpiredId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Expired.ToString()).Id;
      var statusExpirableIds = LinkUsageBackgroundService.Statuses_Expirable.Select(o => _linkUsageStatusService.GetByName(o.ToString()).Id).ToList();

      var items = _linkUsageRepository.Query()
        .Where(o => linkIds.Contains(o.LinkId) && statusExpirableIds.Contains(o.StatusId))
        .ToList();

      if (items.Count == 0)
      {
        logger?.LogInformation("No expirable link usages found for the requested links");
        return;
      }

      items.ForEach(o =>
      {
        o.StatusId = statusExpiredId;
        o.Status = ReferralLinkUsageStatus.Expired;

        logger?.LogInformation("Link usage with id '{id}' flagged for expiration", o.Id);
      });

      await _linkUsageRepository.Update(items);
    }
  }
}


