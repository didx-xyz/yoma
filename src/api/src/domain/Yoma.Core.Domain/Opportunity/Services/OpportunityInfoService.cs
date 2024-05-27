using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Models;
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
    private readonly IOpportunityService _opportunityService;
    private readonly IMyOpportunityService _myOpportunityService;
    private readonly ILinkService _linkService;
    #endregion

    #region Constructor
    public OpportunityInfoService(IOptions<AppSettings> appSettings,
      IOpportunityService opportunityService,
      IMyOpportunityService myOpportunityService,
      ILinkService linkService)
    {
      _appSettings = appSettings.Value;
      _opportunityService = opportunityService;
      _myOpportunityService = myOpportunityService;
      _linkService = linkService;
    }
    #endregion

    #region Public Members
    public OpportunityInfo GetById(Guid id, bool ensureOrganizationAuthorization)
    {
      var opportunity = _opportunityService.GetById(id, true, true, ensureOrganizationAuthorization);

      var result = opportunity.ToOpportunityInfo(_appSettings.AppBaseURL);
      SetParticipantCounts(result);
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

      var result = opportunity.ToOpportunityInfo(_appSettings.AppBaseURL);
      SetParticipantCounts(result);
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

      var result = opportunity.ToOpportunityInfo(_appSettings.AppBaseURL);
      SetParticipantCounts(result);
      return result;
    }

    public OpportunitySearchResultsInfo Search(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization)
    {
      var searchResult = _opportunityService.Search(filter, ensureOrganizationAuthorization);

      var results = new OpportunitySearchResultsInfo
      {
        TotalCount = searchResult.TotalCount,
        Items = searchResult.Items.Select(o => o.ToOpportunityInfo(_appSettings.AppBaseURL)).ToList(),
      };

      results.Items.ForEach(SetParticipantCounts);
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
        CommitmentIntervals = filter.CommitmentIntervals,
        ZltoRewardRanges = filter.ZltoRewardRanges,
        Featured = filter.Featured,
        ValueContains = filter.ValueContains,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize,
        OrderInstructions =
        [
          new() { OrderBy = e => e.DateStart, SortOrder = Core.FilterSortOrder.Descending },
          new() { OrderBy = e => e.DateEnd ?? DateTimeOffset.MaxValue, SortOrder = Core.FilterSortOrder.Descending },
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

      //ordering based aggregatedByViewedOrCompleted ordering; if null will result in no results, thus no ordering applied
      if (mostViewed || mostCompleted)
      {
        filterInternal.OrderInstructions = aggregatedByViewedOrCompleted == null ? null :
        [
          new() { OrderBy = opportunity => aggregatedByViewedOrCompleted.Keys.ToList().IndexOf(opportunity.Id) }
        ];
      }

      var searchResult = _opportunityService.Search(filterInternal, false);

      var results = new OpportunitySearchResultsInfo
      {
        TotalCount = searchResult.TotalCount,
        Items = searchResult.Items.Select(o => o.ToOpportunityInfo(_appSettings.AppBaseURL)).ToList(),
      };

      results.Items.ForEach(SetParticipantCounts);
      return results;
    }

    public (string fileName, byte[] bytes) ExportToCSVOpportunitySearch(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var result = Search(filter, ensureOrganizationAuthorization);

      var cc = new CsvConfiguration(System.Globalization.CultureInfo.CurrentCulture);

      using var stream = new MemoryStream();
      using (var sw = new StreamWriter(stream: stream, encoding: System.Text.Encoding.UTF8))
      {
        using var cw = new CsvWriter(sw, cc);
        cw.WriteRecords(result.Items);
      }

      var fileName = $"Transactions_{DateTimeOffset.UtcNow:yyyy-dd-M--HH-mm-ss}.csv";
      return (fileName, stream.ToArray());
    }
    #endregion

    #region Private Members
    private void SetParticipantCounts(OpportunityInfo result)
    {
      var filter = new MyOpportunitySearchFilterAdmin
      {
        TotalCountOnly = true,
        Opportunity = result.Id,
        Action = MyOpportunity.Action.Verification,
        VerificationStatuses = [MyOpportunity.VerificationStatus.Pending]
      };

      var searchResult = _myOpportunityService.Search(filter, false);
      result.ParticipantCountVerificationPending = searchResult.TotalCount ?? default;
      result.ParticipantCountTotal = result.ParticipantCountVerificationCompleted + result.ParticipantCountVerificationPending;
    }
    #endregion
  }
}
