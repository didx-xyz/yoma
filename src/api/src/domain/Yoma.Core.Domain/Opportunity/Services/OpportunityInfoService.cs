using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.Extensions.Options;
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
    #endregion

    #region Constructor
    public OpportunityInfoService(IOptions<AppSettings> appSettings,
      IOpportunityService opportunityService,
      IMyOpportunityService myOpportunityService)
    {
      _appSettings = appSettings.Value;
      _opportunityService = opportunityService;
      _myOpportunityService = myOpportunityService;
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

    //anonymously accesable from controller
    public OpportunityInfo GetPublishedOrExpiredById(Guid id)
    {
      var opportunity = _opportunityService.GetById(id, true, true, false);

      //inactive organization
      if (opportunity.OrganizationStatus != Entity.OrganizationStatus.Active)
        throw new EntityNotFoundException($"Opportunity with id '{id}' belongs to an inactive organization");

      //status criteria not met
      var statuses = new List<Status>() { Status.Active, Status.Expired }; //ignore DateStart, includes both not started and started
      if (!statuses.Contains(opportunity.Status))
        throw new EntityNotFoundException($"Opportunity with id '{id}' has an invalid status. Expected status(es): '{string.Join(", ", statuses)}'");

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
      ArgumentNullException.ThrowIfNull(filter);

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

      var mostViewed = filter.MostViewed.HasValue && filter.MostViewed.Value;
      Dictionary<Guid, int>? aggregatedByViewed = null;
      if (mostViewed)
      {
        aggregatedByViewed = _myOpportunityService.ListAggregatedOpportunityByViewed(filterInternal.PublishedStates.Contains(PublishedState.Expired));
        filterInternal.Opportunities = aggregatedByViewed?.Keys.ToList() ?? [];
      }

      var searchResult = _opportunityService.Search(filterInternal, false);

      if (mostViewed)
        searchResult.Items = [.. searchResult.Items.OrderBy(opportunity => aggregatedByViewed?.Keys.ToList().IndexOf(opportunity.Id))];

      var results = new OpportunitySearchResultsInfo
      {
        TotalCount = searchResult.TotalCount,
        Items = searchResult.Items.Select(o => o.ToOpportunityInfo(_appSettings.AppBaseURL)).ToList(),
      };

      results.Items.ForEach(SetParticipantCounts);
      return results;
    }

    public (string fileName, byte[] bytes) ExportToCSVOpportunitySearch(OpportunitySearchFilterAdmin filter)
    {
      ArgumentNullException.ThrowIfNull(filter);

      var result = Search(filter, true);

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
