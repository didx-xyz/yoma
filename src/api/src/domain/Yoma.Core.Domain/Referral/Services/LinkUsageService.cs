using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Validators;
using Yoma.Core.Domain.Reward.Interfaces;

namespace Yoma.Core.Domain.Referral.Services
{
  public class LinkUsageService : ILinkUsageService
  {
    #region Class Variables
    private readonly ILogger<LinkUsageService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private readonly IProgramService _programService;
    private readonly ILinkUsageStatusService _linkUsageStatusService;
    private readonly IUserService _userService;
    private readonly IMyOpportunityService _myOpportunityService;
    private readonly ILinkService _linkService;
    private readonly IRewardService _rewardService;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IExecutionStrategyService _executionStrategyService;

    private readonly ReferralLinkUsageSearchFilterValidator _referralLinkUsageSearchFilterValidator;

    private readonly IRepositoryBatched<ReferralLinkUsage> _linkUsageRepository;

    private const string Key_Prefix = "link_usage_process_progress";
    #endregion

    #region Constructor
    public LinkUsageService(
      ILogger<LinkUsageService> logger,
      IOptions<AppSettings> appSettings,
      IHttpContextAccessor httpContextAccessor,

      IProgramService programService,
      ILinkUsageStatusService linkUsageStatusService,
      IUserService userService,
      IMyOpportunityService myOpportunityService,
      ILinkService linkService,
      IRewardService rewardService,
      IDistributedLockService distributedLockService,
      IExecutionStrategyService executionStrategyService,

      ReferralLinkUsageSearchFilterValidator referralLinkUsageSearchFilterValidator,

      IRepositoryBatched<ReferralLinkUsage> linkUsageRepository)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

      _programService = programService ?? throw new ArgumentNullException(nameof(programService));
      _linkUsageStatusService = linkUsageStatusService ?? throw new ArgumentNullException(nameof(linkUsageStatusService));
      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _myOpportunityService = myOpportunityService ?? throw new ArgumentNullException(nameof(myOpportunityService));
      _linkService = linkService ?? throw new ArgumentNullException(nameof(linkService));
      _rewardService = rewardService ?? throw new ArgumentNullException(nameof(rewardService));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));

      _referralLinkUsageSearchFilterValidator = referralLinkUsageSearchFilterValidator ?? throw new ArgumentNullException(nameof(referralLinkUsageSearchFilterValidator));

      _linkUsageRepository = linkUsageRepository ?? throw new ArgumentNullException(nameof(linkUsageRepository));
    }
    #endregion

    #region Public Members
    public ReferralLinkUsageInfo GetById(Guid id, bool includeComputed, bool ensureOwnership, bool allowAdminOverride)
    {
      if (id == Guid.Empty) throw new ArgumentNullException(nameof(id));

      var result = _linkUsageRepository.Query().SingleOrDefault(x => x.Id == id)
        ?? throw new EntityNotFoundException($"Referral link usage with Id '{id}' does not exist");

      if (!ensureOwnership) return ToInfo(result, includeComputed);

      if (allowAdminOverride && _httpContextAccessor.HttpContext!.User.IsInRole(Constants.Role_Admin)) return ToInfo(result, includeComputed);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      if (result.UserId != user.Id //as referee
        && result.UserIdReferrer != user.Id) //as referrer
        throw new SecurityException("Unauthorized");

      return ToInfo(result, includeComputed);
    }

    public ReferralLinkUsageInfo GetByProgramIdAsReferee(Guid programId, bool includeComputed)
    {
      if (programId == Guid.Empty)
        throw new ArgumentNullException(nameof(programId));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var results = _linkUsageRepository.Query().Where(x => x.ProgramId == programId && x.UserId == user.Id).ToList();

      if (results.Count > 1)
        throw new DataInconsistencyException($"Multiple referral link usages found for program '{programId}' for the current user: Link id's '{string.Join(", ", results.Select(x => x.LinkId))}'");

      if (results.Count == 0)
        throw new EntityNotFoundException($"Referral link usage for program '{programId}' and the current user does not exist");

      return ToInfo(results.Single(), includeComputed);
    }

    public ReferralLinkUsageSearchResults SearchAsReferee(ReferralLinkUsageSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var results = Search(new ReferralLinkUsageSearchFilterAdmin
      {
        LinkId = filter.LinkId,
        ProgramId = filter.ProgramId,
        Statuses = filter.Statuses,
        DateStart = filter.DateStart,
        DateEnd = filter.DateEnd,
        UserIdReferee = user.Id,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize
      });

      return results;
    }

    public ReferralLinkUsageSearchResults SearchAsReferrer(ReferralLinkUsageSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var results = Search(new ReferralLinkUsageSearchFilterAdmin
      {
        LinkId = filter.LinkId,
        ProgramId = filter.ProgramId,
        Statuses = filter.Statuses,
        DateStart = filter.DateStart,
        DateEnd = filter.DateEnd,
        UserIdReferrer = user.Id,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize
      });

      return results;
    }

    public ReferralLinkUsageSearchResults Search(ReferralLinkUsageSearchFilterAdmin filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _referralLinkUsageSearchFilterValidator.ValidateAndThrow(filter);

      var query = _linkUsageRepository.Query();

      //linkId
      if (filter.LinkId.HasValue)
        query = query.Where(x => x.LinkId == filter.LinkId.Value);

      //programId
      if (filter.ProgramId.HasValue)
        query = query.Where(x => x.ProgramId == filter.ProgramId.Value);

      //statuses
      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        filter.Statuses = [.. filter.Statuses.Distinct()];
        var statusIds = filter.Statuses.Select(o => _linkUsageStatusService.GetByName(o.ToString()).Id).ToList();
        query = query.Where(o => statusIds.Contains(o.StatusId));
      }

      //date range
      if (filter.DateStart.HasValue)
      {
        filter.DateStart = filter.DateStart.Value.RemoveTime();
        query = query.Where(o => o.DateCreated >= filter.DateStart.Value);
      }

      if (filter.DateEnd.HasValue)
      {
        filter.DateEnd = filter.DateEnd.Value.ToEndOfDay();
        query = query.Where(o => o.DateCreated <= filter.DateEnd.Value);
      }

      //userIdReferee
      if (filter.UserIdReferee.HasValue)
        query = query.Where(x => x.UserId == filter.UserIdReferee.Value);

      //userIdReferrer
      if (filter.UserIdReferrer.HasValue)
        query = query.Where(x => x.UserIdReferrer == filter.UserIdReferrer.Value);

      query = query.OrderByDescending(o => o.DateModified)
        .ThenBy(o => o.LinkName)
        .ThenBy(o => o.ProgramName)
        .ThenBy(o => o.UserDisplayName)
        .ThenBy(o => o.Id);

      var results = new ReferralLinkUsageSearchResults();

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      results.Items = [.. query];

      return results;
    }

    public async Task ClaimAsReferee(Guid linkId)
    {
      var link = _linkService.GetById(linkId, true, false, false, false);
      var program = _programService.GetById(link.ProgramId, true, false);
      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      // Self-referral guard
      if (link.UserId == user.Id)
        throw new ValidationException("You cannot claim your own referral link");

      // Prevents retroactive claims — only allowed within 10 minutes of onboarding
      if (!user.DateYoIDOnboarded.HasValue)
        throw new ValidationException("You must complete your profile before claiming a referral link");

      if (DateTimeOffset.UtcNow - user.DateYoIDOnboarded.Value > TimeSpan.FromMinutes(10))
        throw new ValidationException("You are already registered. Registration with a referral link only applies to new registrations");

      // All usages by this user (any program)
      var userUsages = _linkUsageRepository.Query().Where(u => u.UserId == user.Id);

      // Block if user has participated in ANY OTHER program
      var otherProgramsClaimed = userUsages
        .Where(u => u.ProgramId != program.Id)
        .Select(o => o.ProgramName)
        .Distinct()
        .ToList();

      if (otherProgramsClaimed.Count > 0)
        throw new ValidationException($"You have already participated in program(s) '{string.Join(", ", otherProgramsClaimed)}' and cannot claim again.");

      // For THIS program: a user can have at most one usage (unique on UserId, ProgramId)
      var usagesForProgram = userUsages.Where(o => o.ProgramId == program.Id).ToList();

      if (usagesForProgram.Count > 1)
        throw new DataInconsistencyException(
          $"Data integrity violation: user '{user.Id}' has {usagesForProgram.Count} usage records for program '{program.Id}'. Expected at most one.");

      var usageExisting = usagesForProgram.FirstOrDefault();
      if (usageExisting is not null)
      {
        // Use the existing link for accurate messaging; avoid re-fetch if it matches the incoming link
        var existingLink = usageExisting.LinkId == link.Id
          ? link
          : _linkService.GetById(usageExisting.LinkId, true, false, false, false);

        var msgUsageExisting = $"You have already participated in program '{program.Name}' and cannot claim again";

        switch (usageExisting.Status)
        {
          case ReferralLinkUsageStatus.Pending:
            // Fallback guard in case program expiration job has’t run yet
            var effectiveExpiry = program.CompletionWindowInDays.HasValue
              ? usageExisting.DateClaimed.AddDays(program.CompletionWindowInDays.Value)
              : program.DateEnd; // fallback to program end if defined

            if (effectiveExpiry.HasValue && effectiveExpiry <= DateTimeOffset.UtcNow)
              throw new ValidationException(
                $"{msgUsageExisting}. Your previous claim for link '{existingLink.Name}' on '{usageExisting.DateClaimed:yyyy-MM-dd}' has expired on '{effectiveExpiry:yyyy-MM-dd}'");

            if (usageExisting.LinkId == link.Id)
              throw new ValidationException(
                $"You already claimed this link '{existingLink.Name}' on '{usageExisting.DateClaimed:yyyy-MM-dd}' and it is still pending");
            else
              throw new ValidationException(
                $"{msgUsageExisting}. You already claimed link '{existingLink.Name}' on '{usageExisting.DateClaimed:yyyy-MM-dd}' and it is still pending");

          case ReferralLinkUsageStatus.Completed:
            if (usageExisting.LinkId == link.Id)
              throw new ValidationException(
                $"You already completed program '{program.Name}' using link '{existingLink.Name}' on '{usageExisting.DateCompleted:yyyy-MM-dd}'");
            else
              throw new ValidationException(
                $"{msgUsageExisting}. You already completed program '{program.Name}' using link '{existingLink.Name}' on '{usageExisting.DateCompleted:yyyy-MM-dd}'");

          case ReferralLinkUsageStatus.Expired:
            if (usageExisting.LinkId == link.Id)
              throw new ValidationException(
                $"Your claim for link '{existingLink.Name}' on '{usageExisting.DateClaimed:yyyy-MM-dd}' expired on '{usageExisting.DateExpired:yyyy-MM-dd}'");
            else
              throw new ValidationException(
                $"{msgUsageExisting}. Your claim for link '{existingLink.Name}' on '{usageExisting.DateClaimed:yyyy-MM-dd}' expired on '{usageExisting.DateExpired:yyyy-MM-dd}'");

          default:
            throw new InvalidOperationException($"Unsupported referral link usage status: {usageExisting.Status}");
        }
      }

      // Program must be active, not before start, not after end
      if (program.Status != ProgramStatus.Active)
        throw new ValidationException($"Program '{program.Name}' status is '{program.Status}'");

      if (program.DateStart > DateTimeOffset.UtcNow)
        throw new ValidationException($"Program '{program.Name}' only starts on '{program.DateStart:yyyy-MM-dd}'");

      if (program.DateEnd.HasValue && program.DateEnd <= DateTimeOffset.UtcNow) // Fallback guard if expiration job hasn’t run yet
        throw new ValidationException($"Program '{program.Name}' expired on '{program.DateEnd:yyyy-MM-dd}'");

      // Caps at claim time: program-wide + per-referrer
      var programCapReached =
          (program.CompletionLimit.HasValue && (program.CompletionBalance ?? 0) <= 0) ||
          (program.CompletionLimitReferee.HasValue && link.CompletionTotal >= program.CompletionLimitReferee);

      if (programCapReached)
        throw new ValidationException($"Program '{program.Name}' has reached its completion limit");

      // Link must be active (referrer blocks should already have cancelled links)
      if (link.Status != ReferralLinkStatus.Active)
        throw new ValidationException($"Referral link '{link.Name}' status is '{link.Status}'");

      // Create first-time usage (DB unique index on (UserId, ProgramId) should enforce idempotency under race)
      var usage = new ReferralLinkUsage
      {
        ProgramId = program.Id,
        LinkId = link.Id,
        UserId = user.Id,
        StatusId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Pending.ToString()).Id,
        DateClaimed = DateTimeOffset.UtcNow
      };

      await _linkUsageRepository.Create(usage);


      //TODO: NotificationType.ReferralUsage_Welcome (sent to referee / youth)
    }

    public async Task ProcessProgressByUserId(Guid userId)
    {
      if (userId == Guid.Empty) throw new ArgumentNullException(nameof(userId));

      var user = _userService.GetById(userId, false, false);

      // Business rule (current): one usage per program (DB-enforced); also a single claim across all programs (may change later)
      var statusPendingId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Pending.ToString()).Id;
      var statusCompletedId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Completed.ToString()).Id;
      var statusExpiredId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Expired.ToString()).Id;
      var statusExpirableIds = LinkUsageBackgroundService.Statuses_Expirable.Select(o => _linkUsageStatusService.GetByName(o.ToString()).Id).ToList();

      var lockKey = $"{Key_Prefix}:{user.Id}";
      var lockDuration = TimeSpan.FromSeconds(_appSettings.DistributedLockReferralProgressDurationInSeconds);

      await _distributedLockService.RunWithLockAsync(lockKey, lockDuration, async () =>
      {
        // snapshot of worklist
        var pendingUsageIds = _linkUsageRepository.Query().Where(o => o.UserId == user.Id && o.StatusId == statusPendingId).OrderBy(o => o.DateClaimed).Select(o => o.Id).ToList();
        if (pendingUsageIds.Count == 0)
        {
          _logger.LogInformation("Referral progress: no pending usages for user {UserId}", user.Id);
          return;
        }

        _logger.LogInformation("Referral progress: processing {Count} pending usages for user {UserId}", pendingUsageIds.Count, user.Id);

        var programCache = new Dictionary<Guid, Program>();
        var linkCache = new Dictionary<Guid, ReferralLink>();
        var now = DateTimeOffset.UtcNow;

        foreach (var usageId in pendingUsageIds)
        {
          // Process each usage independently; a broken row must not abort the batch
          await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
          {
            using var scope = TransactionScopeHelper.CreateSerializable(TransactionScopeOption.RequiresNew);

            var myUsage = _linkUsageRepository.Query().Single(o => o.Id == usageId);
            if (myUsage.Status != ReferralLinkUsageStatus.Pending) //state change between fetching the worklist and processing
            {
              _logger.LogInformation("Referral progress: skipping LinkUsage '{LinkUsageId}' with status '{Status}'", myUsage.Id, myUsage.Status);
              return;
            }

            // Fallback completion window check (see LinkUsageBackgroundService.ProcessExpiration); if elapsed expire the usage and continue
            if (statusExpirableIds.Contains(myUsage.StatusId)
              && myUsage.ProgramCompletionWindowInDays.HasValue && myUsage.DateClaimed <= now.AddDays(-myUsage.ProgramCompletionWindowInDays.Value))
            {
              myUsage.StatusId = statusExpiredId;
              myUsage.Status = ReferralLinkUsageStatus.Expired;
              myUsage = await _linkUsageRepository.Update(myUsage);

              _logger.LogInformation("Referral progress: Expiring LinkUsage '{LinkUsageId}' (claimed {DateClaimed:yyyy-MM-dd}, window {WindowDays} days, program {ProgramId}, link {LinkId})",
                myUsage.Id, myUsage.DateClaimed, myUsage.ProgramCompletionWindowInDays, myUsage.ProgramId, myUsage.LinkId);

              scope.Complete();
              return;
            }

            // Evaluate pathway completion
            var usageProgress = ToInfo(myUsage, true);
            if (!usageProgress.Completed)
            {
              _logger.LogDebug("Referral progress: usage {UsageId} not completed yet; skipping", myUsage.Id);

              scope.Complete();
              return;
            }

            if (!programCache.TryGetValue(myUsage.ProgramId, out var program))
            {
              program = _programService.GetById(myUsage.ProgramId, false, false);
              programCache[program.Id] = program;
            }

            if (!linkCache.TryGetValue(myUsage.LinkId, out var link))
            {
              link = _linkService.GetById(myUsage.LinkId, false, false, false, false);
              linkCache[link.Id] = link;
            }

            // Default: eligible for rewards unless a cap was reached (do not punish in-flight)
            var eligibleForRewards = true;

            // Program gating
            switch (program.Status)
            {
              case ProgramStatus.Active:
                // allowed, rewards allowed
                _logger.LogDebug("Referral progress: program {ProgramId} ACTIVE for usage {UsageId}", program.Id, myUsage.Id);
                break;

              case ProgramStatus.Inactive:
                // do not punish in-flight; rewards allowed
                _logger.LogDebug("Referral progress: program {ProgramId} INACTIVE (in-flight allowed) for usage {UsageId}", program.Id, myUsage.Id);
                break;

              case ProgramStatus.UnCompletable:
                // race condition: usage might have just completed; do not punish in-flight; rewards allowed
                _logger.LogDebug("Referral progress: program {ProgramId} UNCOMPLETABLE (in-flight allowed) for usage {UsageId}", program.Id, myUsage.Id);
                break;

              case ProgramStatus.Deleted:
                // do not punish in-flight; but the link should have been cancelled via cascade
                if (LinkService.Statuses_Cancellable.Contains(link.Status))
                {
                  throw new DataInconsistencyException(
                    $"Program {program.Id} is Deleted but link {link.Id} status is {link.Status}. " +
                    $"Expected link to be Cancelled by cascade. Usage {myUsage.Id} cannot be processed safely");
                }
                _logger.LogInformation("Referral progress: program {ProgramId} DELETED (in-flight allowed) for usage {UsageId}; link status {LinkStatus}",
                  program.Id, myUsage.Id, link.Status);
                break;

              case ProgramStatus.LimitReached:
                // In-flight completions allowed; rewards suppressed
                eligibleForRewards = false;
                _logger.LogInformation("Referral progress: program {ProgramId} LIMIT_REACHED → rewards suppressed for usage {UsageId}", program.Id, myUsage.Id);
                break;

              case ProgramStatus.Expired:
                // By cascade, link+usage should already be expired
                throw new DataInconsistencyException(
                  $"Program {program.Id} is Expired but usage {myUsage.Id} is still Pending and link {link.Id} has status {link.Status}. " +
                  $"Expected cascade: link Expired and usage Expired");

              default:
                throw new InvalidOperationException($"Unsupported program status: {program.Status}");
            }

            // fallback limit reached check if eligibility; only flip active to limit reached (see below); might remain in another state until activated (update, status update or health probe)
            if (eligibleForRewards && program.CompletionLimit.HasValue && (program.CompletionTotal ?? 0) >= program.CompletionLimit.Value)
            {
              eligibleForRewards = false;
              _logger.LogInformation("Referral progress: program {ProgramId} completion cap reached (total {Total} >= limit {Limit}); suppressing rewards for usage {UsageId}",
                program.Id, program.CompletionTotal, program.CompletionLimit, myUsage.Id);
            }

            // Link gating
            switch (link.Status)
            {
              case ReferralLinkStatus.Active:
                // allowed, rewards allowed unless program suppressed
                _logger.LogDebug("Referral progress: link {LinkId} ACTIVE for usage {UsageId}", link.Id, myUsage.Id);
                break;

              case ReferralLinkStatus.Cancelled:
                // do not punish in-flight; rewards allowed unless program suppressed
                _logger.LogDebug("Referral progress: link {LinkId} CANCELLED (in-flight allowed) for usage {UsageId}", link.Id, myUsage.Id);
                break;

              case ReferralLinkStatus.LimitReached:
                // In-flight completions allowed; rewards suppressed
                eligibleForRewards = false;
                _logger.LogInformation("Referral progress: link {LinkId} LIMIT_REACHED → rewards suppressed for usage {UsageId}", link.Id, myUsage.Id);
                break;

              case ReferralLinkStatus.Expired:
                // By cascade, usage should already be expired
                throw new DataInconsistencyException(
                  $"Link {link.Id} is Expired but usage {myUsage.Id} is still Pending under program {program.Id}. " +
                  $"Expected cascade: usage Expired");

              default:
                throw new InvalidOperationException($"Unsupported link status: {link.Status}");
            }

            // fallback limit reached check if eligibility; only flip active to limit reached (see below); can be in cancelled state and processing in flight
            if (eligibleForRewards && program.CompletionLimitReferee.HasValue && link.CompletionTotal >= program.CompletionLimitReferee.Value)
            {
              eligibleForRewards = false;
              _logger.LogInformation("Referral progress: link {LinkId} per-referrer cap reached (total {Total} >= limit {Limit}); suppressing rewards for usage {UsageId}",
                link.Id, link.CompletionTotal, program.CompletionLimitReferee, myUsage.Id);
            }

            _logger.LogDebug("Referral progress: eligibility for rewards on usage {UsageId} = {Eligible}",
              myUsage.Id, eligibleForRewards);

            // Calculates and assigns completion rewards for a referral usage based on the program’s
            // configured reward amounts and remaining ZLTO reward pool.
            // • Pool behavior:
            //   – The pool funds referee first (up to target), then referrer (up to target from remainder).
            //   – Partial payouts allowed; if pool is empty, both get 0 (completion still counts).
            // • Null handling:
            //   – Null program targets ⇒ corresponding usage rewards remain null.
            //   – Non-null targets but insufficient pool ⇒ usage rewards set to 0 (never negative).
            decimal? rewardReferee = null;
            decimal? rewardReferrer = null;

            if (eligibleForRewards)
            {
              // Program-configured targets (nullable)
              decimal? refereeTarget = program.ZltoRewardReferee;
              decimal? referrerTarget = program.ZltoRewardReferrer;

              // Pool balance (treat null as 0, clamp to ≥ 0)
              decimal pool = Math.Max(program.ZltoRewardBalance ?? 0m, 0m);

              // Pay referee first (up to target if configured)
              if (refereeTarget.HasValue)
              {
                var payReferee = Math.Min(pool, refereeTarget.Value);
                rewardReferee = payReferee;
                pool -= payReferee;
              }

              // Pay referrer next (whatever remains, up to target if configured)
              if (referrerTarget.HasValue)
              {
                var payReferrer = Math.Min(pool, referrerTarget.Value);
                rewardReferrer = payReferrer;
                pool -= payReferrer;
              }

              // Per-party logging (full/partial/zero)
              if (refereeTarget.HasValue)
              {
                if (rewardReferee == refereeTarget.Value)
                  _logger.LogInformation("Referral progress: referee FULL payout for usage {UsageId} => {Amount}", myUsage.Id, rewardReferee);
                else if ((rewardReferee ?? 0m) > 0m)
                  _logger.LogInformation("Referral progress: referee PARTIAL payout for usage {UsageId} => {Amount} (target {Target})", myUsage.Id, rewardReferee, refereeTarget);
                else
                  _logger.LogInformation("Referral progress: referee ZERO payout for usage {UsageId}", myUsage.Id);
              }
              else
                _logger.LogInformation("Referral progress: referee payout not configured (null) for usage {UsageId}", myUsage.Id);

              if (referrerTarget.HasValue)
              {
                if (rewardReferrer == referrerTarget.Value)
                  _logger.LogInformation("Referral progress: referrer FULL payout for usage {UsageId} => {Amount}", myUsage.Id, rewardReferrer);
                else if ((rewardReferrer ?? 0m) > 0m)
                  _logger.LogInformation("Referral progress: referrer PARTIAL payout for usage {UsageId} => {Amount} (target {Target})", myUsage.Id, rewardReferrer, referrerTarget);
                else
                  _logger.LogInformation("Referral progress: referrer ZERO payout for usage {UsageId}", myUsage.Id);
              }
              else
                _logger.LogInformation("Referral progress: referrer payout not configured (null) for usage {UsageId}", myUsage.Id);

              _logger.LogInformation("Referral progress: summary for usage {UsageId} — referee {RefereePaid}, referrer {ReferrerPaid}",
                myUsage.Id, rewardReferee ?? 0m, rewardReferrer ?? 0m);
            }
            else
              _logger.LogInformation("Referral progress: rewards suppressed by eligibility for usage {UsageId}", myUsage.Id);

            myUsage.ZltoRewardReferee = rewardReferee;
            myUsage.ZltoRewardReferrer = rewardReferrer;
            myUsage.Status = ReferralLinkUsageStatus.Completed;
            myUsage.StatusId = statusCompletedId;
            myUsage = await _linkUsageRepository.Update(myUsage);

            decimal? totalAwarded = (rewardReferee.HasValue || rewardReferrer.HasValue)
              ? (rewardReferee ?? 0m) + (rewardReferrer ?? 0m)
              : null;

            // We update Program first so global cap logic can cascade-close all active links (set to LIMIT_REACHED)
            var programStatusCurrent = program.Status;
            var linkStatusCurrent = link.Status;

            // Increment running totals (CompletionTotal and ZltoRewardCumulative); may flip Program to LIMIT_REACHED if ACTIVE, inclusive of all ACTIVE links (global completion cap hit)
            program = await _programService.ProcessCompletion(program, totalAwarded);

            // If the program flipped from ACTIVE → LIMIT_REACHED, all ACTIVE links will also be flipped to LIMIT_REACHED
            if (programStatusCurrent == ProgramStatus.Active && program.Status == ProgramStatus.LimitReached && linkStatusCurrent == ReferralLinkStatus.Active)
              // Re-read ensures we don't rely on a stale in-memory link
              link = _linkService.GetById(myUsage.LinkId, false, false, false, false);
  
            // Increment running totals (CompletionTotal and ZltoRewardCumulative); may flip to LIMIT_REACHED if ACTIVE (per-referrer completion cap hit)
            link = await _linkService.ProcessCompletion(program, link, totalAwarded);

            linkCache[link.Id] = link;
            programCache[program.Id] = program;

            // schedule reward transactions
            if ((rewardReferrer ?? 0m) > 0m)
              await _rewardService.ScheduleRewardTransaction(myUsage.UserIdReferrer, Reward.RewardTransactionEntityType.ReferralLinkUsage, myUsage.Id, rewardReferrer!.Value);

            if ((rewardReferee ?? 0m) > 0m)
              await _rewardService.ScheduleRewardTransaction(myUsage.UserId, Reward.RewardTransactionEntityType.ReferralLinkUsage, myUsage.Id, rewardReferee!.Value);

            //TODO: NotificationType.ReferralLink_Usage_Completed (sent to referrer / youth)
            //TODO: NotificationType.ReferralUsage_Welcome (sent to referee / youth)

            scope.Complete();
          });
        }
      });
    }
    #endregion

    #region Private Members
    private ReferralLinkUsageInfo ToInfo(ReferralLinkUsage item, bool includeComputed)
    {
      var result = new ReferralLinkUsageInfo
      {
        Id = item.Id,
        ProgramId = item.ProgramId,
        ProgramName = item.ProgramName,
        ProgramDescription = item.ProgramDescription,
        LinkId = item.LinkId,
        LinkName = item.LinkName,
        UserIdReferrer = item.UserIdReferrer,
        UserDisplayNameReferrer = item.UserDisplayNameReferrer!,
        UserEmailReferrer = item.UserEmailReferrer,
        UserPhoneNumberReferrer = item.UserPhoneNumberReferrer,
        UserId = item.UserId,
        UserDisplayName = item.UserDisplayName!,
        UserEmail = item.UserEmail,
        UserPhoneNumber = item.UserPhoneNumber,
        StatusId = item.StatusId,
        Status = item.Status,
        DateClaimed = item.DateClaimed,
        ZltoRewardReferrer = item.ZltoRewardReferrer,
        ZltoRewardReferee = item.ZltoRewardReferee,
        DateCompleted = item.DateCompleted,
        DateExpired = item.DateExpired,
        ProofOfPersonhoodMethod = ProofOfPersonhoodMethod.None
      };

      if (!includeComputed) return result;  

      if (item.UserPhoneNumberConfirmed == true) result.ProofOfPersonhoodMethod |= ProofOfPersonhoodMethod.OTP;
      if (_userService.HasSocialIdentityProviders(item.UserId)) result.ProofOfPersonhoodMethod |= ProofOfPersonhoodMethod.SocialLogin;
      result.ProofOfPersonhoodCompleted = result.ProofOfPersonhoodMethod != ProofOfPersonhoodMethod.None;

      var program = _programService.GetById(item.ProgramId, true, false);
      if (program.PathwayRequired && program.Pathway == null)
        throw new DataInconsistencyException("Pathway required but does not exist");

      if (program.Pathway == null)
      {
        result.PercentComplete = result.ProofOfPersonhoodCompleted == true ? 100 : 0;
        return result;
      }

      result.PercentComplete = result.ProofOfPersonhoodCompleted == true ? 50 : 0;

      // NOTE:
      // Pathway StepsTotal, TasksTotal, Completed and PercentComplete are computed inline via property getters.
      // They are not stored values — each is dynamically calculated based on the current Steps/Tasks state.
      result.Pathway = new ProgramPathwayProgress
      {
        Id = program.Pathway.Id,
        Name = program.Pathway.Name,
        Rule = program.Pathway.Rule,
        OrderMode = program.Pathway.OrderMode,
        IsCompletable = program.Pathway.IsCompletable,
        Steps =
        [
           .. (program.Pathway.Steps ?? []).Select(s => new ProgramPathwayStepProgress
          {
            Id = s.Id,
            Name = s.Name,
            Rule = s.Rule,
            OrderMode = s.OrderMode,
            Order = s.Order,
            OrderDisplay = s.OrderDisplay,
            IsCompletable = s.IsCompletable,
            Tasks =
            [
              .. (s.Tasks ?? []).Select(t =>
              {
                var task = new ProgramPathwayTaskProgress
                {
                  Id = t.Id,
                  EntityType = t.EntityType,
                  Opportunity = t.Opportunity,
                  Order = t.Order,
                  OrderDisplay = t.OrderDisplay,
                  IsCompletable = t.IsCompletable,
                  NonCompletableReason = t.NonCompletableReason
                };

                switch (t.EntityType)
                {
                  case PathwayTaskEntityType.Opportunity:
                    if (t.Opportunity == null)
                      throw new DataInconsistencyException("Pathway task entity type is 'Opportunity' but no opportunity is assigned");

                    var verify = _myOpportunityService.GetVerificationStatus(t.Opportunity.Id, result.UserId);
                    if (verify.Status == VerificationStatus.Completed)
                    {
                      task.Completed = true;
                      task.DateCompleted = verify.DateCompleted;
                    }
                    break;

                  default:
                    throw new InvalidOperationException($"Unsupported pathway task entity type: {t.EntityType}");
                }

                return task;
              })
            ]
          })
        ]
      };

      result.PercentComplete += result.Pathway.PercentComplete * 0.5m;

      return result;
    }
    #endregion
  }
}
