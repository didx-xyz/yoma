using FluentValidation;
using Microsoft.AspNetCore.Http;
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
      IHttpContextAccessor httpContextAccessor,
      IUserService userService,
      ILinkStatusService linkStatusService,
      ILinkUsageStatusService linkUsageStatusService,
      ReferralAnalyticsSearchFilterValidator referralAnalyticsSearchFilterValidator,
      IRepositoryBatched<ReferralLinkUsage> linkUsageRepository,
      IRepositoryBatchedValueContainsWithNavigation<ReferralLink> linkRepository)
    {
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

      var results = new ReferralAnalyticsSearchResults();

      // order by usage count completed (leader board), then by user display name, and lastly by user ID to ensure deterministic sorting / consistent pagination results
      if (!filter.UnrestrictedQuery || filter.PaginationEnabled)
        query = query.OrderByDescending(x => x.UsageCountCompleted).ThenBy(x => x.UserDisplayName).ThenBy(o => o.UserId);

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
          .GroupBy(l => new { l.UserId, l.UserDisplayName })
          .Select(g => new ReferralAnalyticsUser
          {
            UserId = g.Key.UserId,
            UserDisplayName = g.Key.UserDisplayName,

            UsageCountCompleted = g.Where(x => x.StatusId == statusCompletedId).Count(),
            UsageCountPending = g.Where(x => x.StatusId == statusPendingId).Count(),
            UsageCountExpired = g.Where(x => x.StatusId == statusExpiredId).Count(),

            ZltoRewardTotal = g.Sum(x => x.ZltoRewardReferee ?? 0)
          });

      return groupedQuery;
    }

    private IQueryable<ReferralAnalyticsUser> SearchQueryAsReferrer(ReferralAnalyticsSearchFilterAdmin filter)
    {
      var linkStatusActiveId = _linkStatusService.GetByName(ReferralLinkStatus.Active.ToString()).Id;
      var usageStatusPendingId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Pending.ToString()).Id;
      var usageStatusExpiredId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Expired.ToString()).Id;

      // base link query (referrer = link owner)
      var linkQuery = _linkRepository.Query(includeChildItems: true);

      // program
      if (filter.ProgramId.HasValue)
        linkQuery = linkQuery.Where(o => o.ProgramId == filter.ProgramId.Value);

      // date range
      if (filter.StartDate.HasValue)
      {
        var startDate = filter.StartDate.Value.RemoveTime();
        linkQuery = linkQuery.Where(o => o.DateCreated >= startDate);
      }

      if (filter.EndDate.HasValue)
      {
        var endDate = filter.EndDate.Value.ToEndOfDay();
        linkQuery = linkQuery.Where(o => o.DateCreated <= endDate);
      }

      // referrer filter (link owner)
      if (filter.UserId.HasValue)
        linkQuery = linkQuery.Where(o => o.UserId == filter.UserId.Value);

      // IMPORTANT: only now, after all filters, derive link IDs
      var linkIds = linkQuery.Select(o => o.Id);

      // aggregate usages per referrer, limited by filtered links via FK LinkId
      var usageAgg =
       _linkUsageRepository.Query()
       .Where(u => linkIds.Contains(u.LinkId))
       .GroupBy(u => u.UserIdReferrer)
       .Select(g => new
       {
         UserIdReferrer = g.Key,
         Pending = g.Count(x => x.StatusId == usageStatusPendingId),
         Expired = g.Count(x => x.StatusId == usageStatusExpiredId),
         Total = g.Count()
       });

      // aggregate links per referrer
      var linkAgg =
        linkQuery
          .GroupBy(l => new { l.UserId, l.UserDisplayName })
          .Select(g => new
          {
            g.Key.UserId,
            g.Key.UserDisplayName,
            LinkCount = g.Count(),
            LinkCountActive = g.Count(x => x.StatusId == linkStatusActiveId),
            Completed = g.Sum(x => x.CompletionTotal.HasValue ? x.CompletionTotal.Value : 0),
            ZltoReward = g.Sum(x => x.ZltoRewardCumulative.HasValue ? x.ZltoRewardCumulative.Value : 0)
          });

      // left join link + usage aggregates on referrer
      return linkAgg
        .GroupJoin(
          usageAgg,
          l => l.UserId,
          u => u.UserIdReferrer,
          (l, usages) => new { l, usages }
        )
        .SelectMany(
          x => x.usages.DefaultIfEmpty(),
          (x, u) => new ReferralAnalyticsUser
          {
            UserId = x.l.UserId,
            UserDisplayName = x.l.UserDisplayName,
            LinkCount = x.l.LinkCount,
            LinkCountActive = x.l.LinkCountActive,
            UsageCountCompleted = x.l.Completed,
            UsageCountPending = u != null ? u.Pending : 0,
            UsageCountExpired = u != null ? u.Expired : 0,
            ZltoRewardTotal = x.l.ZltoReward
          });
    }
    #endregion
  }
}
