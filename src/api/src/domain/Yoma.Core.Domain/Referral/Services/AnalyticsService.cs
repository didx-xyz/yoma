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

      if (!filter.UnrestrictedQuery || filter.PaginationEnabled)
        query = query
          .OrderByDescending(x => x.UsageCountCompleted) // usage count completed - leader board
          .ThenBy(x => x.UserDisplayName) // then by user display name
          .ThenBy(o => o.UserId); // ensure deterministic sorting / consistent pagination results

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
      var linkUsageQuery = _linkUsageRepository.Query();

      var statusCompletedId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Completed.ToString()).Id;
      var statusPendingId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Pending.ToString()).Id;
      var statusExpiredId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Expired.ToString()).Id;

      if (filter.ProgramId.HasValue)
        linkUsageQuery = linkUsageQuery.Where(o => o.ProgramId == filter.ProgramId.Value);

      if (filter.StartDate.HasValue)
      {
        var startDate = filter.StartDate.Value.RemoveTime();
        linkUsageQuery = linkUsageQuery.Where(o => o.DateCreated >= startDate);
      }

      if (filter.EndDate.HasValue)
      {
        var endDate = filter.EndDate.Value.ToEndOfDay();
        linkUsageQuery = linkUsageQuery.Where(o => o.DateCreated <= endDate);
      }

      // filtered by referee (user who used the link)
      if (filter.UserId.HasValue)
        linkUsageQuery = linkUsageQuery.Where(o => o.UserId == filter.UserId.Value);

      var resultQuery =
         linkUsageQuery
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

      return resultQuery;
    }

    private IQueryable<ReferralAnalyticsUser> SearchQueryAsReferrer(ReferralAnalyticsSearchFilterAdmin filter)
    {
      var linkStatusActiveId = _linkStatusService.GetByName(ReferralLinkStatus.Active.ToString()).Id;
      var usageStatusPendingId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Pending.ToString()).Id;
      var usageStatusExpiredId = _linkUsageStatusService.GetByName(ReferralLinkUsageStatus.Expired.ToString()).Id;

      var linkQuery = _linkRepository.Query();

      if (filter.ProgramId.HasValue)
        linkQuery = linkQuery.Where(o => o.ProgramId == filter.ProgramId.Value);

      if (filter.StartDate.HasValue)
        linkQuery = linkQuery.Where(o => o.DateCreated >= filter.StartDate.Value.RemoveTime());

      if (filter.EndDate.HasValue)
        linkQuery = linkQuery.Where(o => o.DateCreated <= filter.EndDate.Value.ToEndOfDay());

      // filtered by referrer (user who created the link)
      if (filter.UserId.HasValue)
        linkQuery = linkQuery.Where(o => o.UserId == filter.UserId.Value);

      var linkIds = linkQuery.Select(o => o.Id); // links owned by referrer / user

      var linkUsageQueryAgg = _linkUsageRepository.Query()
          .Where(u => linkIds.Contains(u.LinkId)) // usages for links owned by referrer / user
          .GroupBy(u => u.UserIdReferrer)
          .Select(g => new
          {
            UserIdReferrer = g.Key,
            UsageCountPending = (int?)g.Count(x => x.StatusId == usageStatusPendingId),
            UsageCountExpired = (int?)g.Count(x => x.StatusId == usageStatusExpiredId),
            ZltoRewardTotal = (decimal?)g.Sum(x => x.ZltoRewardReferrer ?? 0m)
          });

      var linkQueryAgg = linkQuery
          .GroupBy(l => l.UserId)
          .Select(g => new
          {
            UserId = g.Key,
            UserDisplayName = g.Max(x => x.UserDisplayName) ?? string.Empty,
            LinkCount = g.Count(),
            LinkCountActive = g.Count(x => x.StatusId == linkStatusActiveId),
            UsageCountCompleted = g.Sum(x => x.CompletionTotal ?? 0)
          });

      // EF Core + Npgsql materializer bug (5+ years, still open): https://github.com/dotnet/efcore/issues/12355
      // When a LEFT JOIN returns NULL for a column that is projected directly into a non-nullable int property,
      // EF Core still reads the raw NULL value during materialization and crashes with "Nullable object must have a value"
      // — even though it generates correct COALESCE(..., 0) in SQL.
      //
      // Only triggered on stage (PostgreSQL 16.9 + ARM64 + real data with actual NULLs).
      // Local (PG 17 + x64 + test data) never hit the buggy path.
      //
      // Fix: two-stage projection — first materialize to anonymous type with nullable ints,
      // then coalesce in the final Select to ReferralAnalyticsUser.
      // Keeps everything in the DB, fully scalable, no memory issues.
      var resultQuery = linkQueryAgg
          .GroupJoin(
              linkUsageQueryAgg,
              l => l.UserId,
              u => u.UserIdReferrer,
              (l, usages) => new { l, usages }
          )
          .SelectMany(
              x => x.usages.DefaultIfEmpty(),
              (x, u) => new
              {
                x.l.UserId,
                x.l.UserDisplayName,
                x.l.LinkCount,
                x.l.LinkCountActive,
                x.l.UsageCountCompleted,
                UsageCountPending = u != null ? u.UsageCountPending : null,
                UsageCountExpired = u != null ? u.UsageCountExpired : null,
                ZltoRewardTotal = u != null ? u.ZltoRewardTotal : null
              })
          .Select(temp => new ReferralAnalyticsUser
          {
            UserId = temp.UserId,
            UserDisplayName = temp.UserDisplayName,
            LinkCount = temp.LinkCount,
            LinkCountActive = temp.LinkCountActive,
            UsageCountCompleted = temp.UsageCountCompleted,
            UsageCountPending = temp.UsageCountPending ?? 0,
            UsageCountExpired = temp.UsageCountExpired ?? 0,
            ZltoRewardTotal = temp.ZltoRewardTotal ?? 0
          });

      return resultQuery;
    }
    #endregion
  }
}
