using MediatR;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral.Events;
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

    private readonly IMediator _mediator;
    private readonly IExecutionStrategyService _executionStrategyService;

    private readonly IRepositoryBatchedValueContainsWithNavigation<ReferralLink> _linkRepository;
    private readonly IRepositoryBatched<ReferralLinkUsage> _linkUsageRepository;

    private const int Processing_BatchSize = 1000;
    private const int Processing_Parallelism = 10;
    #endregion

    #region Constructor
    public LinkMaintenanceService(
      ILinkStatusService linkStatusService,
      ILinkUsageStatusService linkUsageStatusService,

      IMediator mediator,
      IExecutionStrategyService executionStrategyService,

      IRepositoryBatchedValueContainsWithNavigation<ReferralLink> linkRepository,
      IRepositoryBatched<ReferralLinkUsage> linkUsageRepository)
    {
      _linkStatusService = linkStatusService ?? throw new ArgumentNullException(nameof(linkStatusService));
      _linkUsageStatusService = linkUsageStatusService ?? throw new ArgumentNullException(nameof(linkUsageStatusService));

      _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));

      _linkRepository = linkRepository ?? throw new ArgumentNullException(nameof(linkRepository));
      _linkUsageRepository = linkUsageRepository ?? throw new ArgumentNullException(nameof(linkUsageRepository));
    }
    #endregion

    #region Public Members
    public ReferralLink GetById(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _linkRepository.Query().SingleOrDefault(o => o.Id == id)
        ?? throw new EntityNotFoundException("This referral link could not be found");

      return result;
    }

    /// <summary>
    /// Action upon program hitting global completion cap: flips all links associated with the specified program that are eligible
    /// </summary>
    public async Task LimitReachedByProgramId(Guid programId, ILogger? logger = null)
    {
      if (programId == Guid.Empty)
        throw new ArgumentNullException(nameof(programId));

      await LimitReachedByProgramId([programId], logger);
    }

    /// <summary>
    /// Action upon program hitting global completion cap: flips all links associated with the specified program that are eligible
    /// </summary>
    public async Task LimitReachedByProgramId(List<Guid> programIds, ILogger? logger = null)
    {
      if (programIds == null || programIds.Count == 0 || programIds.Any(id => id == Guid.Empty))
        throw new ArgumentNullException(nameof(programIds));

      programIds = [.. programIds.Distinct()];

      var statusLimitReachedId = _linkStatusService.GetByName(ReferralLinkStatus.LimitReached.ToString()).Id;
      var statusLimitReachableIds = LinkService.Statuses_LimitReached.Select(s => _linkStatusService.GetByName(s.ToString()).Id).ToList();

      var items = _linkRepository.Query()
        .Where(o => programIds.Contains(o.ProgramId) && statusLimitReachableIds.Contains(o.StatusId))
        .ToList();

      if (items.Count == 0)
      {
        if (logger?.IsEnabled(LogLevel.Information) == true) logger.LogInformation("No links eligible to flip to limit reached for {ProgramCount} program(s)", programIds.Count);
        return;
      }

      items.ForEach(o => { o.StatusId = statusLimitReachedId; o.Status = ReferralLinkStatus.LimitReached; });

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted();

        var linkIds = items.Select(o => o.Id).Distinct().ToList();

        await _linkRepository.Update(items);
        await AbandonLinkUsagesByLinkId(linkIds, logger);

        scope.Complete();
      });

      if (logger == null || !logger.IsEnabled(LogLevel.Information)) return;

      var byProgram = items.GroupBy(x => x.ProgramId).Select(g => new { g.Key, Count = g.Count() }).ToList();
      foreach (var g in byProgram)
        logger.LogInformation("Flipped {Count} link(s) to limit reached for program {ProgramId}", g.Count, g.Key);

      logger.LogInformation("Flipped {Total} link(s) to limit reached across {ProgramCount} program(s)", items.Count, byProgram.Count);
    }

    /// <summary>
    /// Action upon referrer blocking: flip all links associated with the specified program that are eligible
    /// </summary>
    public async Task CancelByUserId(Guid userId)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      var statusCancelledId = _linkStatusService.GetByName(ReferralLinkStatus.Cancelled.ToString()).Id;
      var statusCancellableIds = LinkService.Statuses_Cancellable.Select(s => _linkStatusService.GetByName(s.ToString()).Id).ToList();

      var items = _linkRepository.Query()
        .Where(o => o.UserId == userId && statusCancellableIds.Contains(o.StatusId))
        .ToList();

      if (items.Count == 0) return;

      items.ForEach(o =>
      {
        o.StatusId = statusCancelledId;
        o.Status = ReferralLinkStatus.Cancelled;
      });

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted();

        var linkIds = items.Select(o => o.Id).Distinct().ToList();

        await _linkRepository.Update(items);
        await AbandonLinkUsagesByLinkId(linkIds);

        scope.Complete();
      });
    }

    /// <summary>
    /// Action upon program deletion: cancels all links associated with the specified program that are eligible for cancellation
    /// </summary>
    public async Task CancelByProgramId(Guid programId, ILogger? logger = null)
    {
      if (programId == Guid.Empty)
        throw new ArgumentNullException(nameof(programId));

      await CancelByProgramId([programId], logger);
    }

    /// <summary>
    /// Action upon program deletion: cancels all links associated with the specified programs that are eligible for cancellation
    /// </summary>
    public async Task CancelByProgramId(List<Guid> programIds, ILogger? logger = null)
    {
      if (programIds == null || programIds.Count == 0 || programIds.Any(id => id == Guid.Empty))
        throw new ArgumentNullException(nameof(programIds));

      programIds = [.. programIds.Distinct()];

      var statusCancelledId = _linkStatusService.GetByName(ReferralLinkStatus.Cancelled.ToString()).Id;
      var statusCancellableIds = LinkService.Statuses_Cancellable.Select(s => _linkStatusService.GetByName(s.ToString()).Id).ToList();

      var items = _linkRepository.Query()
        .Where(o => programIds.Contains(o.ProgramId) && statusCancellableIds.Contains(o.StatusId))
        .ToList();

      if (items.Count == 0)
      {
        if (logger?.IsEnabled(LogLevel.Information) == true) logger.LogInformation("No cancellable links found for {ProgramCount} program(s)", programIds.Count);
        return;
      }

      items.ForEach(o => { o.StatusId = statusCancelledId; o.Status = ReferralLinkStatus.Cancelled; });

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted();

        var linkIds = items.Select(o => o.Id).Distinct().ToList();

        await _linkRepository.Update(items);
        await AbandonLinkUsagesByLinkId(linkIds, logger);

        scope.Complete();
      });

      if (logger == null || !logger.IsEnabled(LogLevel.Information)) return;

      var byProgram = items.GroupBy(x => x.ProgramId).Select(g => new { g.Key, Count = g.Count() }).ToList();
      foreach (var g in byProgram)
        logger.LogInformation("Cancelled {Count} link(s) for program {ProgramId}", g.Count, g.Key);

      logger.LogInformation("Cancelled {Total} link(s) across {ProgramCount} program(s)", items.Count, byProgram.Count);
    }

    /// <summary>
    /// Action upon program expiration: expires all links and usages associated with the specified programs that are eligible for expiration
    /// </summary>
    public async Task ExpireByProgramId(List<Guid> programIds, ILogger? logger = null)
    {
      if (programIds == null || programIds.Count == 0 || programIds.Any(o => o == Guid.Empty))
        throw new ArgumentNullException(nameof(programIds));
      programIds = [.. programIds.Distinct()];

      var statusExpiredId = _linkStatusService.GetByName(ReferralLinkStatus.Expired.ToString()).Id;
      var statusExpirableIds = LinkService.Statuses_Expirable.Select(o => _linkStatusService.GetByName(o.ToString()).Id).ToList();

      var items = _linkRepository.Query()
        .Where(o => programIds.Contains(o.ProgramId) && statusExpirableIds.Contains(o.StatusId))
        .ToList();

      if (items.Count == 0)
      {
        if (logger?.IsEnabled(LogLevel.Information) == true) logger.LogInformation("No expirable links found for {ProgramCount} program(s)", programIds.Count);
        return;
      }

      items.ForEach(o => { o.StatusId = statusExpiredId; o.Status = ReferralLinkStatus.Expired; });

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted();

        var linkIds = items.Select(o => o.Id).Distinct().ToList();

        await _linkRepository.Update(items);
        await AbandonLinkUsagesByLinkId(linkIds, logger);
        await ExpireLinkUsagesByLinkId(linkIds, logger);

        scope.Complete();
      });

      if (logger == null || !logger.IsEnabled(LogLevel.Information)) return;

      var byProgram = items.GroupBy(x => x.ProgramId).Select(g => new { g.Key, Count = g.Count() }).ToList();
      foreach (var g in byProgram)
        logger.LogInformation("Expired {Count} link(s) for program {ProgramId}", g.Count, g.Key);

      logger.LogInformation("Expired {Total} link(s) across {ProgramCount} program(s)", items.Count, byProgram.Count);
    }

    /// <summary>
    /// Trigger sweep: reprocesses all pending link usages for a program when completion requirements are reduced
    /// (e.g. Proof of Personhood or Pathway removed), ensuring users are re-evaluated against updated rules.
    /// </summary>
    public async Task ProcessUsageProgressByProgramId(Guid programId, ILogger? logger = null)
    {
      if (programId == Guid.Empty) throw new ArgumentNullException(nameof(programId));

      var statusPendingId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Pending.ToString()).Id;
      var totalProcessed = 0;
      var page = 0;

      using var throttler = new SemaphoreSlim(Processing_Parallelism, Processing_Parallelism);

      while (true)
      {
        var items = _linkUsageRepository.Query()
          .Where(o => o.ProgramId == programId && o.StatusId == statusPendingId)
          .OrderBy(o => o.Id)
          .Take(Processing_BatchSize)
          .Select(o => new { o.UserId, o.Username, o.UserDisplayName })
          .ToList();

        if (items.Count == 0) break;

        var tasks = items.Select(async item =>
        {
          await throttler.WaitAsync();
          try
          {
            await _mediator.Publish(new ReferralProgressTriggerEvent(new ReferralProgressTriggerMessage
            {
              Source = ReferralTriggerSource.ProgramUpdated,
              UserId = item.UserId,
              Username = item.Username,
              UserDisplayName = item.UserDisplayName
            }));
          }
          finally { throttler.Release(); }
        });

        await Task.WhenAll(tasks);

        totalProcessed += items.Count;
        page++;
      }

      if (logger == null || !logger.IsEnabled(LogLevel.Information)) return;

      if (totalProcessed == 0)
        logger.LogInformation("No pending link usages found for program {ProgramId}", programId);
      else
        logger.LogInformation("Processed {Count} pending link usage(s) for program {ProgramId}", totalProcessed, programId);
    }

    /// <summary>
    /// Action upon terminal link / program state: abandon all initiated usages with the specified link
    /// </summary>
    public async Task AbandonLinkUsagesByLinkId(Guid linkId, ILogger? logger = null)
    {
      if (linkId == Guid.Empty)
        throw new ArgumentNullException(nameof(linkId));

      await AbandonLinkUsagesByLinkId([linkId], logger);
    }

    /// <summary>
    /// Action upon terminal link / program state: abandon all initiated usages with the specified links
    /// </summary>
    public async Task AbandonLinkUsagesByLinkId(List<Guid> linkIds, ILogger? logger = null)
    {
      if (linkIds == null || linkIds.Count == 0 || linkIds.Any(o => o == Guid.Empty))
        throw new ArgumentNullException(nameof(linkIds));

      linkIds = [.. linkIds.Distinct()];

      var statusInitiatedId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Initiated.ToString()).Id;
      var statusAbandonedId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Abandoned.ToString()).Id;

      var totalProcessed = 0;

      while (true)
      {
        var items = _linkUsageRepository.Query()
          .Where(o => linkIds.Contains(o.LinkId) && o.StatusId == statusInitiatedId)
          .OrderBy(o => o.Id)
          .Take(Processing_BatchSize)
          .ToList();

        if (items.Count == 0) break;

        items.ForEach(o => { o.StatusId = statusAbandonedId; o.Status = ReferralLinkUsageStatus.Abandoned; });
        await _linkUsageRepository.Update(items);

        totalProcessed += items.Count;
      }

      if (logger == null || !logger.IsEnabled(LogLevel.Information)) return;

      if (totalProcessed == 0)
        logger.LogInformation("No initiated link usages found for {LinkCount} link(s)", linkIds.Count);
      else
        logger.LogInformation("Abandoned {Count} initiated link usage(s) across {LinkCount} link(s)", totalProcessed, linkIds.Count);
    }
    #endregion

    #region Private Members
    /// <summary>
    /// Action upon program expiration: expire all usages with the specified links that are eligible for expiration
    /// </summary>
    private async Task ExpireLinkUsagesByLinkId(List<Guid> linkIds, ILogger? logger = null)
    {
      if (linkIds == null || linkIds.Count == 0 || linkIds.Any(o => o == Guid.Empty))
        throw new ArgumentNullException(nameof(linkIds));

      linkIds = [.. linkIds.Distinct()];

      var statusExpiredId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Expired.ToString()).Id;
      var statusExpirableIds = LinkUsageBackgroundService.Statuses_Expirable.Select(o => _linkUsageStatusService.GetByName(o.ToString()).Id).ToList();

      var totalProcessed = 0;

      while (true)
      {
        var items = _linkUsageRepository.Query()
          .Where(o => linkIds.Contains(o.LinkId) && statusExpirableIds.Contains(o.StatusId))
          .OrderBy(o => o.Id)
          .Take(Processing_BatchSize)
          .ToList();

        if (items.Count == 0) break;

        items.ForEach(o => { o.StatusId = statusExpiredId; o.Status = ReferralLinkUsageStatus.Expired; });
        await _linkUsageRepository.Update(items);

        totalProcessed += items.Count;
      }

      if (logger == null || !logger.IsEnabled(LogLevel.Information)) return;

      if (totalProcessed == 0)
        logger.LogInformation("No expirable link usages found for {LinkCount} link(s)", linkIds.Count);
      else
        logger.LogInformation("Expired {Count} link usage(s) across {LinkCount} link(s)", totalProcessed, linkIds.Count);
    }
    #endregion
  }
}
