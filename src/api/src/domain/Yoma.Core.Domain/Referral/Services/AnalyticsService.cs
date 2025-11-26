using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Validators;

namespace Yoma.Core.Domain.Referral.Services
{
  public sealed class AnalyticsService : IAnalyticsService
  {
    #region Class Variables
    private readonly ILogger<AnalyticsService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private readonly IUserService _userService;

    private readonly ILinkStatusService _linkStatusService;
    private readonly ILinkUsageStatusService _linkUsageStatusService;

    private readonly ReferralAnalyticsSearchFilterValidator _referralAnalyticsSearchFilterValidator;

    private readonly IRepositoryBatched<ReferralLinkUsage> _linkUsageRepository;
    private readonly IRepositoryBatchedValueContainsWithNavigation<ReferralLink> _linkRepository;
    #endregion

    #region Constructor
    public AnalyticsService(
      ILogger<AnalyticsService> logger,
      IHttpContextAccessor httpContextAccessor,
      IUserService userService,
      ILinkStatusService linkStatusService,
      ILinkUsageStatusService linkUsageStatusService,
      ReferralAnalyticsSearchFilterValidator referralAnalyticsSearchFilterValidator,
      IRepositoryBatched<ReferralLinkUsage> linkUsageRepository,
      IRepositoryBatchedValueContainsWithNavigation<ReferralLink> linkRepository)
    { 
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _linkStatusService = linkStatusService ?? throw new ArgumentNullException(nameof(linkStatusService));
      _linkUsageStatusService = linkUsageStatusService ?? throw new ArgumentNullException(nameof(linkUsageStatusService));

      _referralAnalyticsSearchFilterValidator = referralAnalyticsSearchFilterValidator ?? throw new ArgumentNullException(nameof(referralAnalyticsSearchFilterValidator));

      _linkUsageRepository = linkUsageRepository ?? throw new ArgumentNullException(nameof(linkUsageRepository));
      _linkRepository = linkRepository ?? throw new ArgumentNullException(nameof(linkRepository));
    }
    #endregion

    #region Public Members
    public ReferralAnalyticsUser ByUser(ReferralParticipationRole role)
    {
      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var filter = new ReferralAnalyticsSearchFilterAdmin
      {
        Role = role,
        UserId = user.Id,
        UnrestrictedQuery = true
      };

      var result = Search(filter).Items.SingleOrDefault()
        ?? new ReferralAnalyticsUser
        {
          UserId = user.Id,
          UserDisplayName = user.DisplayName ?? user.Username
        };

      return result;
    }

    public ReferralAnalyticsSearchResultsInfo Search(ReferralAnalyticsSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var filterAdmin = new ReferralAnalyticsSearchFilterAdmin
      {
        Role = filter.Role,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize
      };

      var results = Search(filterAdmin);
      results.Items.ForEach(x => x.UserDisplayName = RedactorHelper.RedactDisplayName(x.UserDisplayName));
      return results;
    }

    public ReferralAnalyticsSearchResults Search(ReferralAnalyticsSearchFilterAdmin filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _referralAnalyticsSearchFilterValidator.ValidateAndThrow(filter);

      IQueryable<ReferralAnalyticsUser> query = filter.Role switch
      {
        ReferralParticipationRole.Referrer => SearchQueryAsReferrer(filter),
        ReferralParticipationRole.Referee => SearchQueryAsReferee(filter),
        _ => throw new NotSupportedException(
          $"The role '{filter.Role}' is not supported for referral analytics search"),
      };

      // order by usage count completed (leader board), then by user display name, and lastly by user ID to ensure deterministic sorting / consistent pagination results
      if (!filter.UnrestrictedQuery || filter.PaginationEnabled)
        query = query.OrderByDescending(x => x.UsageCountCompleted).ThenBy(x => x.UserDisplayName).ThenBy(o => o.UserId);

      var results = new ReferralAnalyticsSearchResults();

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber!.Value - 1) * filter.PageSize!.Value).Take(filter.PageSize.Value);
      }

      results.Items = [.. query];

      return results;
    }
    #endregion

    #region Private Members
    private IQueryable<ReferralAnalyticsUser> SearchQueryAsReferee(ReferralAnalyticsSearchFilterAdmin filter)
    {
      var query = _linkUsageRepository.Query();

      var statusCompletedId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Completed.ToString()).Id;
      var statusPendingId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Pending.ToString()).Id;
      var statusExpiredId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Expired.ToString()).Id;

      // program
      if (filter.ProgramId.HasValue)
        query = query.Where(o => o.ProgramId == filter.ProgramId.Value);

      // date range
      if (filter.StartDate.HasValue)
      {
        var startDate = filter.StartDate.Value.RemoveTime();
        query = query.Where(o => o.DateCreated >= startDate);
      }

      if (filter.EndDate.HasValue)
      {
        var endDate = filter.EndDate.Value.ToEndOfDay();
        query = query.Where(o => o.DateCreated <= endDate);
      }

      // referee filter
      if (filter.UserId.HasValue)
        query = query.Where(o => o.UserId == filter.UserId.Value);

      var groupedQuery =
         query
          .GroupBy(l => l.UserId)
          .Select(g => new ReferralAnalyticsUser
          {
            UserId = g.Key,
            UserDisplayName = g.Max(x => x.UserDisplayName) ?? string.Empty,

            UsageCountCompleted = g.Count(x => x.StatusId == statusCompletedId),
            UsageCountPending = g.Count(x => x.StatusId == statusPendingId),
            UsageCountExpired = g.Count(x => x.StatusId == statusExpiredId),

            ZltoRewardTotal = g.Sum(x => x.ZltoRewardReferee ?? 0)
          });

      return groupedQuery;
    }

    private IQueryable<ReferralAnalyticsUser> SearchQueryAsReferrer(ReferralAnalyticsSearchFilterAdmin filter)
    {
      var linkStatusActiveId = _linkStatusService.GetByName(ReferralLinkStatus.Active.ToString()).Id;
      var usageStatusPendingId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Pending.ToString()).Id;
      var usageStatusExpiredId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Expired.ToString()).Id;

      _logger.LogInformation(
        "ReferralAnalytics Referrer: Start | ProgramId={ProgramId}, UserId={UserId}, StartDate={StartDate}, EndDate={EndDate}",
        filter.ProgramId, filter.UserId, filter.StartDate, filter.EndDate
      );

      // base link query
      var linkQuery = _linkRepository.Query();

      if (filter.ProgramId.HasValue)
        linkQuery = linkQuery.Where(o => o.ProgramId == filter.ProgramId.Value);

      if (filter.StartDate.HasValue)
        linkQuery = linkQuery.Where(o => o.DateCreated >= filter.StartDate.Value.RemoveTime());

      if (filter.EndDate.HasValue)
        linkQuery = linkQuery.Where(o => o.DateCreated <= filter.EndDate.Value.ToEndOfDay());

      if (filter.UserId.HasValue)
        linkQuery = linkQuery.Where(o => o.UserId == filter.UserId.Value);

      var linkIdsQuery = linkQuery.Select(o => o.Id);

      _logger.LogInformation("ReferralAnalytics Referrer: linkAggQuery building…");

      // 1️⃣ LINK AGGREGATES (DB)
      var linkAggQuery =
          linkQuery
            .GroupBy(l => l.UserId)
            .Select(g => new LinkAggDto
            {
              UserId = g.Key,
              UserDisplayName = g.Max(x => x.UserDisplayName) ?? string.Empty,
              LinkCount = g.Count(),
              LinkCountActive = g.Count(x => x.StatusId == linkStatusActiveId),
              Completed = g.Sum(x => x.CompletionTotal ?? 0),
              ZltoReward = g.Sum(x => x.ZltoRewardCumulative ?? 0)
            });

      List<LinkAggDto> linkAgg;
      try
      {
        linkAgg = linkAggQuery.ToList();
        _logger.LogInformation("ReferralAnalytics Referrer: linkAgg materialized | rows={Count}", linkAgg.Count);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "ReferralAnalytics Referrer: ERROR materializing linkAgg");
        throw;
      }

      _logger.LogInformation("ReferralAnalytics Referrer: usageAggQuery building…");

      // 2️⃣ USAGE AGGREGATES (DB)
      var usageAggQuery =
          _linkUsageRepository.Query()
            .Where(u => linkIdsQuery.Contains(u.LinkId))
            .GroupBy(u => u.UserIdReferrer)
            .Select(g => new UsageAggDto
            {
              UserIdReferrer = g.Key,
              Pending = g.Count(x => x.StatusId == usageStatusPendingId),
              Expired = g.Count(x => x.StatusId == usageStatusExpiredId)
            });

      List<UsageAggDto> usageAgg;
      try
      {
        usageAgg = usageAggQuery.ToList();
        _logger.LogInformation("ReferralAnalytics Referrer: usageAgg materialized | rows={Count}", usageAgg.Count);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "ReferralAnalytics Referrer: ERROR materializing usageAgg");
        throw;
      }

      // sample logs
      foreach (var x in linkAgg.Take(2))
        _logger.LogInformation("linkAgg sample: UserId={UserId}, Completed={Completed}, Reward={Reward}",
          x.UserId, x.Completed, x.ZltoReward);

      foreach (var x in usageAgg.Take(2))
        _logger.LogInformation("usageAgg sample: UserIdReferrer={UserId}, Pending={Pending}, Expired={Expired}",
          x.UserIdReferrer, x.Pending, x.Expired);

      // 3️⃣ IN-MEMORY JOIN
      _logger.LogInformation("ReferralAnalytics Referrer: joining in-memory…");

      var results =
        from l in linkAgg
        join u in usageAgg on l.UserId equals u.UserIdReferrer into gj
        from u in gj.DefaultIfEmpty()
        select new ReferralAnalyticsUser
        {
          UserId = l.UserId,
          UserDisplayName = l.UserDisplayName,
          LinkCount = l.LinkCount,
          LinkCountActive = l.LinkCountActive,
          UsageCountCompleted = l.Completed,
          UsageCountPending = u?.Pending ?? 0,
          UsageCountExpired = u?.Expired ?? 0,
          ZltoRewardTotal = l.ZltoReward
        };

      var resultList = results.ToList();

      _logger.LogInformation("ReferralAnalytics Referrer: final rows={Count}", resultList.Count);

      return resultList.AsQueryable();
    }

    // DTOs used for typed intermediate projections:
    private sealed class LinkAggDto
    {
      public Guid UserId { get; set; }
      public string UserDisplayName { get; set; } = null!;
      public int LinkCount { get; set; }
      public int LinkCountActive { get; set; }
      public int Completed { get; set; }
      public decimal ZltoReward { get; set; }
    }

    private sealed class UsageAggDto
    {
      public Guid UserIdReferrer { get; set; }
      public int Pending { get; set; }
      public int Expired { get; set; }
    }


    #endregion
  }
}
