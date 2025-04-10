using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Services
{
  public class OpportunityInfoService : IOpportunityInfoService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IOpportunityService _opportunityService;
    private readonly IMyOpportunityService _myOpportunityService;
    private readonly ILinkService _linkService;
    private readonly IUserService _userService;
    private readonly IDownloadService _downloadService;
    #endregion

    #region Constructor
    public OpportunityInfoService(IOptions<AppSettings> appSettings,
      IHttpContextAccessor httpContextAccessor,
      IOpportunityService opportunityService,
      IMyOpportunityService myOpportunityService,
      ILinkService linkService,
      IUserService userService,
      IDownloadService downloadService)
    {
      _appSettings = appSettings.Value;
      _httpContextAccessor = httpContextAccessor;
      _opportunityService = opportunityService;
      _myOpportunityService = myOpportunityService;
      _linkService = linkService;
      _userService = userService;
      _downloadService = downloadService;
    }
    #endregion

    #region Public Members
    public OpportunityInfo GetById(Guid id, bool ensureOrganizationAuthorization)
    {
      var opportunity = _opportunityService.GetById(id, true, true, ensureOrganizationAuthorization);

      var result = opportunity.ToOpportunityInfo(_appSettings.AppBaseURL);
      SetEngagementCounts(result);
      return result;
    }

    //anonymously accessible from controller
    public OpportunityInfo GetPublishedOrExpiredByLinkInstantVerify(Guid linkId)
    {
      var link = _linkService.GetById(linkId, false, false);

      link.AssertLinkInstantVerify();

      var opportunity = _opportunityService.GetById(link.EntityId, true, true, false);

      var (publishedOrExpiredResult, message) = opportunity.PublishedOrExpired();

      if (!publishedOrExpiredResult)
      {
        ArgumentException.ThrowIfNullOrEmpty(message);
        throw new EntityNotFoundException(message);
      }

      //do not exclude hidden; instant verify links supports hidden opportunities

      var result = opportunity.ToOpportunityInfo(_appSettings.AppBaseURL);
      SetEngagementCounts(result);
      return result;
    }

    //anonymously accessible from controller
    public OpportunityInfo GetPublishedOrExpiredById(Guid id)
    {
      var opportunity = _opportunityService.GetById(id, true, true, false);

      var (publishedOrExpiredResult, message) = opportunity.PublishedOrExpired();

      if (!publishedOrExpiredResult)
      {
        ArgumentException.ThrowIfNullOrEmpty(message);
        throw new EntityNotFoundException(message);
      }

      if (opportunity.Hidden == true)
        throw new EntityNotFoundException($"Opportunity with id '{opportunity.Id}' is hidden");

      var result = opportunity.ToOpportunityInfo(_appSettings.AppBaseURL);
      SetEngagementCounts(result);
      return result;
    }

    public OpportunitySearchResultsInfo Search(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization)
    {
      var searchResult = _opportunityService.Search(filter, ensureOrganizationAuthorization);

      var results = new OpportunitySearchResultsInfo
      {
        TotalCount = searchResult.TotalCount,
        Items = [.. searchResult.Items.Select(o => o.ToOpportunityInfo(_appSettings.AppBaseURL))],
      };

      results.Items.ForEach(SetEngagementCounts);
      return results;
    }

    public OpportunitySearchResultsInfo Search(OpportunitySearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      //filter validated by OpportunityService.Search
      var filterInternal = new OpportunitySearchFilterAdmin
      {
        PublishedStates = filter.PublishedStates == null || filter.PublishedStates.Count == 0 ?
                    [PublishedState.NotStarted, PublishedState.Active] : filter.PublishedStates,
        Types = filter.Types,
        Categories = filter.Categories,
        Languages = filter.Languages,
        Countries = filter.Countries,
        Organizations = filter.Organizations,
        CommitmentInterval = filter.CommitmentInterval,
        ZltoReward = filter.ZltoReward,
        Featured = filter.Featured,
        ShareWithPartners = filter.ShareWithPartners,
        EngagementTypes = filter.EngagementTypes,
        ValueContains = filter.ValueContains,
        ExcludeHidden = true,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize,
        OrderInstructions =
        [
          new() { OrderBy = e => e.DateStart, SortOrder = Core.FilterSortOrder.Descending },
          new() { OrderBy = e => e.DateEnd ?? DateTimeOffset.MaxValue, SortOrder = Core.FilterSortOrder.Ascending },
          new() { OrderBy = e => e.Title, SortOrder = Core.FilterSortOrder.Ascending },
          new() { OrderBy = e => e.Id, SortOrder = Core.FilterSortOrder.Ascending } //ensure deterministic sorting / consistent pagination results
        ]
      };

      //either MostViewed or MostCompleted can be requested, but not both at the same time; they are mutually exclusive
      var mostViewed = filter.MostViewed.HasValue && filter.MostViewed.Value;
      var mostCompleted = filter.MostCompleted.HasValue && filter.MostCompleted.Value;

      if (mostViewed && mostCompleted)
        throw new FluentValidation.ValidationException("'Most Viewed' and 'Most Completed' filters are mutually exclusive and cannot be used together");

      Dictionary<Guid, int>? aggregatedByViewedOrCompleted = null;
      if (mostViewed)
      {
        aggregatedByViewedOrCompleted = _myOpportunityService.ListAggregatedOpportunityByViewed(filterInternal.PublishedStates.Contains(PublishedState.Expired));
        filterInternal.Opportunities = aggregatedByViewedOrCompleted?.Keys.ToList() ?? [];
      }
      else if (mostCompleted)
      {
        aggregatedByViewedOrCompleted = _myOpportunityService.ListAggregatedOpportunityByCompleted(filterInternal.PublishedStates.Contains(PublishedState.Expired));
        filterInternal.Opportunities = aggregatedByViewedOrCompleted?.Keys.ToList() ?? [];
      }

      //ordering based on aggregatedByViewedOrCompleted ordering; if null will result in no results, thus no ordering applied
      if (mostViewed || mostCompleted)
      {
        filterInternal.OrderInstructions = aggregatedByViewedOrCompleted == null ? null :
        [
          new() { OrderBy = opportunity => aggregatedByViewedOrCompleted.Keys.ToList().IndexOf(opportunity.Id), SortOrder = Core.FilterSortOrder.Ascending }
        ];
      }

      var searchResult = _opportunityService.Search(filterInternal, false);

      var results = new OpportunitySearchResultsInfo
      {
        TotalCount = searchResult.TotalCount,
        Items = [.. searchResult.Items.Select(o => o.ToOpportunityInfo(_appSettings.AppBaseURL))],
      };

      results.Items.ForEach(SetEngagementCounts);
      return results;
    }

    public async Task<(bool scheduleForProcessing, string? fileName, byte[]? bytes)> ExportOrScheduleToCSV(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      if (!filter.PaginationEnabled)
      {
        //schedule the request for processing and return
        var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
        await _downloadService.Schedule(user.Id, Core.DownloadScheduleType.Opporunities, filter);
        return (true, null, null);
      }

      var (fileName, bytes) = ExportToCSV(filter, ensureOrganizationAuthorization, true);

      return (false, fileName, bytes);
    }
    #endregion

    #region Internal Members
    public (string fileName, byte[] bytes) ExportToCSV(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization, bool appendDateStamp)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var result = Search(filter, ensureOrganizationAuthorization);

      return FileHelper.CreateCsvFile(result.Items, "Opportunities", appendDateStamp);
    }
    #endregion

    #region Private Members
    private void SetEngagementCounts(OpportunityInfo result)
    {
      var filter = new MyOpportunitySearchFilterAdmin
      {
        TotalCountOnly = true,
        Opportunity = result.Id,
        Action = MyOpportunity.Action.Viewed,
        NonActionVerificationPublishedOnly = false
      };

      //viewed
      var searchResult = _myOpportunityService.Search(filter, false);
      result.CountViewed = searchResult.TotalCount ?? default;

      //NavigatedExternalLink
      filter.Action = MyOpportunity.Action.NavigatedExternalLink;
      searchResult = _myOpportunityService.Search(filter, false);
      result.CountNavigatedExternalLink = searchResult.TotalCount ?? default;

      //participant counts (verifications)
      filter.Action = MyOpportunity.Action.Verification;
      filter.VerificationStatuses = [VerificationStatus.Pending];
      searchResult = _myOpportunityService.Search(filter, false);
      result.ParticipantCountPending = searchResult.TotalCount ?? default;
      result.ParticipantCountTotal = result.ParticipantCountCompleted + result.ParticipantCountPending;
    }
    #endregion
  }
}
