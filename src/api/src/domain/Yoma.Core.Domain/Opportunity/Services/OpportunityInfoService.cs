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
        private readonly IOpportunityService _opportunityService;
        private readonly IMyOpportunityService _myOpportunityService;
        #endregion

        #region Constructor
        public OpportunityInfoService(IOpportunityService opportunityService,
            IMyOpportunityService myOpportunityService)
        {
            _opportunityService = opportunityService;
            _myOpportunityService = myOpportunityService;
        }
        #endregion

        #region Public Members
        public OpportunityInfo? GetInfoByIdOrNull(Guid id, bool includeChildren, bool includeComputed, bool? includeExpired)
        {
            var opportunity = _opportunityService.GetByIdOrNull(id, includeChildren, includeComputed);

            //inactive organization
            if (opportunity == null || opportunity.OrganizationStatus != Entity.OrganizationStatus.Active) return null;

            //status criteria not met
            var statuses = new List<Status>() { Status.Active };
            if (includeExpired.HasValue && includeExpired.Value) statuses.Add(Status.Expired);
            if (!statuses.Contains(opportunity.Status)) return null;

            var result = opportunity.ToOpportunityInfo();
            if (includeComputed) SetParticipantCounts(result);
            return result;
        }

        public OpportunityInfo? GetInfoByTitleOrNull(string title, bool includeChildItems, bool includeComputed)
        {
            var opportunity = _opportunityService.GetByTitleOrNull(title, includeChildItems, includeComputed);
            if (opportunity == null) return null;

            var result = opportunity.ToOpportunityInfo();
            if (includeComputed) SetParticipantCounts(result);
            return result;
        }

        public OpportunitySearchResultsInfo Search(OpportunitySearchFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            //filter validated by SearchAdmin

            var filterInternal = new OpportunitySearchFilterAdmin
            {
                Published = true, // by default published only (active relating to active organizations, irrespective of started)
                IncludeExpired = filter.IncludeExpired.HasValue && filter.IncludeExpired.Value, // also includes expired (expired relating to active organizations)
                Types = filter.Types,
                Categories = filter.Categories,
                Languages = filter.Languages,
                Countries = filter.Countries,
                Organizations = filter.Organizations,
                CommitmentIntervals = filter.CommitmentIntervals,
                ZltoRewardRanges = filter.ZltoRewardRanges,
                ValueContains = filter.ValueContains,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };

            var mostViewed = filter.MostViewed.HasValue && filter.MostViewed.Value;
            Dictionary<Guid, int>? aggregatedByViewed = null;
            if (mostViewed)
            {
                aggregatedByViewed = _myOpportunityService.ListAggregatedOpportunityByViewed(filter, filterInternal.IncludeExpired);
                filterInternal.Opportunities = aggregatedByViewed?.Keys.ToList() ?? new List<Guid>();
            }

            var searchResult = _opportunityService.Search(filterInternal, false);

            if (mostViewed)
                searchResult.Items = searchResult.Items
                    .OrderBy(opportunity => aggregatedByViewed?.Keys.ToList().IndexOf(opportunity.Id)) //preserver order of aggregatedByViewed, which is ordered by count and then by last viewed date
                    .ToList();

            var results = new OpportunitySearchResultsInfo
            {
                TotalCount = searchResult.TotalCount,
                Items = searchResult.Items.Select(o => o.ToOpportunityInfo()).ToList(),
            };

            results.Items.ForEach(SetParticipantCounts);
            return results;
        }
        #endregion

        #region Private Members
        private void SetParticipantCounts(OpportunityInfo result)
        {
            var filter = new MyOpportunitySearchFilterAdmin
            {
                TotalCountOnly = true,
                Action = MyOpportunity.Action.Verification,
                VerificationStatus = MyOpportunity.VerificationStatus.Pending
            };

            var searchResult = _myOpportunityService.Search(filter, false);
            result.ParticipantCountVerificationPending = searchResult.TotalCount ?? default;
            result.ParticipantCountTotal = result.ParticipantCountVerificationCompleted + result.ParticipantCountVerificationPending;
        }
        #endregion
    }
}
