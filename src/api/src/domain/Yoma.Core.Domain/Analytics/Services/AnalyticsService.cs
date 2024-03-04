using Yoma.Core.Domain.Analytics.Interfaces;
using Yoma.Core.Domain.Analytics.Models;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Analytics.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        #region Class Variables
        private readonly IOrganizationService _organizationService;
        private readonly IMyOpportunityActionService _myOpportunityActionService;
        private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
        private readonly IOpportunityStatusService _opportunityStatusService;
        private readonly IOrganizationStatusService _organizationStatusService;
        private readonly IRepositoryBatchedWithNavigation<MyOpportunity.Models.MyOpportunity> _myOpportunityRepository;
        private readonly IRepository<OpportunityCategory> _opportunityCategoryRepository;
        private readonly IRepository<OpportunityCountry> _opportunityCountryRepository;
        #endregion

        #region Constructor
        public AnalyticsService(IOrganizationService organizationService,
            IMyOpportunityActionService myOpportunityActionService,
            IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
            IOpportunityStatusService opportunityStatusService,
            IOrganizationStatusService organizationStatusService,
            IRepositoryBatchedWithNavigation<MyOpportunity.Models.MyOpportunity> myOpportunityRepository,
            IRepository<OpportunityCategory> opportunityCategoryRepository,
            IRepository<OpportunityCountry> opportunityCountryRepository)
        {
            _organizationService = organizationService;
            _myOpportunityActionService = myOpportunityActionService;
            _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
            _opportunityStatusService = opportunityStatusService;
            _organizationStatusService = organizationStatusService;
            _myOpportunityRepository = myOpportunityRepository;
            _opportunityCategoryRepository = opportunityCategoryRepository;
            _opportunityCountryRepository = opportunityCountryRepository;
        }
        #endregion

        #region Public Members
        public OrganizationSearchResultsSummary SearchOrganizationSummary(OrganizationSearchFilterSummary filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            //TODO: validator

            _organizationService.IsAdmin(filter.Organization, true);

            var queryBase = MyOpportunityQueryBase(filter);

            //'my' opportunities: viewed
            var queryViewed = MyOpportunityQueryViewed(queryBase);

            var itemsViewed = queryViewed.GroupBy(opportunity =>
                DateTimeOffset.UtcNow.Date.AddDays(-(int)opportunity.DateModified.DayOfWeek).AddDays(7)
                )
                .Select(group => new
                {
                    WeekEnding = group.Key,
                    Count = group.Count()
                })
                .OrderBy(result => result.WeekEnding)
                .ToList();

            var resultsViewed = new List<TimeValueEntry>();
            itemsViewed.ForEach(o => { resultsViewed.Add(new TimeValueEntry(o.WeekEnding, o.Count, default(int))); });

            //'my' opportunities: pending
            var queryPending = MyOpportunityQueryPending(queryBase);

            var itemsPending = queryPending.GroupBy(opportunity =>
               DateTimeOffset.UtcNow.Date.AddDays(-(int)opportunity.DateModified.DayOfWeek).AddDays(7)
               )
               .Select(group => new
               {
                   WeekEnding = group.Key,
                   Count = group.Count()
               })
               .OrderBy(result => result.WeekEnding)
               .ToList();

            var resultsPending = new List<TimeValueEntry>();
            itemsPending.ForEach(o => { resultsPending.Add(new TimeValueEntry(o.WeekEnding, o.Count)); });

            //'my' opportunities: completed
            var queryCompleted = MyOpportunityQueryCompleted(queryBase);

            var itemsCompleted = queryViewed.GroupBy(opportunity =>
                 DateTimeOffset.UtcNow.Date.AddDays(-(int)opportunity.DateModified.DayOfWeek).AddDays(7)
                 )
                 .Select(group => new
                 {
                     WeekEnding = group.Key,
                     Count = group.Count()
                 })
                 .OrderBy(result => result.WeekEnding)
                 .ToList();

            var resultsCompleted = new List<TimeValueEntry>();
            itemsCompleted.ForEach(o => { resultsCompleted.Add(new TimeValueEntry(o.WeekEnding, default(int), o.Count)); });

            //'my' opportunities: viewed & completed combined
            var resultsViewedCompleted = resultsViewed.Concat(resultsCompleted)
                .GroupBy(e => e.Date)
                .Select(g => new TimeValueEntry(
                    g.Key,
                    g.Sum(e => Convert.ToInt32(e.Values[0])),
                    g.Sum(e => Convert.ToInt32(e.Values[1]))
                ))
                .OrderBy(e => e.Date)
                .ToList();

            //results
            var result = new OrganizationSearchResultsSummary { Opportunities = new OrganizationOpportunity() };

            var viewedCount = itemsViewed.Sum(o => o.Count);
            var completedCount = itemsCompleted.Sum(o => o.Count);

            //engagement
            //'my' opportunities: viewed & completed verifications
            result.Opportunities.ViewedCompleted = new TimeIntervalSummary()
            { Legend = new[] { "Viewed", "Completions" }, Data = resultsViewedCompleted, Count = new[] { viewedCount, completedCount } };

            //average time
            var dates = queryCompleted
                 .Where(o => o.DateStart.HasValue && o.DateEnd.HasValue)
                 .Select(o => new { o.DateStart, o.DateEnd })
                 .ToList(); 

            var averageCompletionTimeInDays = dates
                .Select(o => (o.DateEnd!.Value - o.DateStart!.Value).TotalDays) 
                .DefaultIfEmpty(0) 
                .Average(); 

            result.Opportunities.Completion = new OpportunityCompletion { AverageTimeInDays = (int)Math.Round(averageCompletionTimeInDays) };

            //converstion rate
            result.Opportunities.ConversionRate = new OpportunityConversionRate { ViewedCount = viewedCount, CompletedCount = completedCount };

            //active opportunities

            //'my' opportunities: pending verifications
            result.Opportunities.PendingVerification = new TimeIntervalSummary()
            { Legend = new[] { "Pending Verifications" }, Data = resultsPending, Count = new[] { itemsPending.Sum(o => o.Count) } };

            //zlto rewards
            var totalRewards = queryCompleted.Sum(o => o.ZltoReward ?? 0);
            result.Opportunities.Reward = new OpportunityReward { TotalAmount = totalRewards };

            //skills
            var skills = queryCompleted.Select(o => new { o.DateModified, o.Skills }).ToList();

            var flattenedSkills = skills
                 .SelectMany(o => o.Skills ?? new List<Skill>())
                 .GroupBy(skill => skill.Id)
                 .Select(g => new { Skill = g.First(), Count = g.Count() })
                 .OrderByDescending(g => g.Count)
                 .ToList();

            var itemSkills = skills
                .SelectMany(o => (o.Skills ?? new List<Skill>()).Select(skill => new { o.DateModified, SkillId = skill.Id }))
                .GroupBy(x => DateTimeOffset.UtcNow.Date.AddDays(-(int)x.DateModified.DayOfWeek).AddDays(7))
                .Select(group => new
                {
                    WeekEnding = group.Key,
                    Count = group.Select(x => x.SkillId).Distinct().Count()
                })
                .OrderBy(result => result.WeekEnding)
                .ToList();

            var resultsSkills = new List<TimeValueEntry>();
            itemSkills.ForEach(o => { resultsSkills.Add(new TimeValueEntry(o.WeekEnding, o.Count)); });
            result.Skills = new OrganizationOpportunitySkill
            {
                TopCompleted = flattenedSkills.Take(10).Select(g => g.Skill).ToList(),
                Items = new TimeIntervalSummary()
                { Legend = new[] { "Total Skills", }, Data = resultsSkills, Count = new[] { itemSkills.Sum(o => o.Count) } }
            };

            //demogrpahics
            var currentDate = DateTimeOffset.UtcNow;
            result.Demographics = new OrganizationDemographic
            {
                //countries
                Countries = queryCompleted
                    .Join(_opportunityCountryRepository.Query(),
                        opportunity => opportunity.OpportunityId,
                        countryInfo => countryInfo.OpportunityId,
                        (opportunity, countryInfo) => new { opportunity, countryInfo.CountryName })
                    .GroupBy(x => x.CountryName)
                    .Select(g => new { CountryName = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(5)
                    .ToDictionary(country => country.CountryName, country => country.Count),

                //gender
                Genders = queryCompleted
                    .GroupBy(opportunity => string.IsNullOrEmpty(opportunity.UserGender) ? "Unspecified" : opportunity.UserGender)
                    .Select(group => new { UserGender = group.Key, Count = group.Count() })
                    .ToDictionary(genderGroup => genderGroup.UserGender, genderGroup => genderGroup.Count),
                //age
                Ages = queryCompleted
                    .Select(o => new {
                        o.UserDateOfBirth,
                        Age = o.UserDateOfBirth.HasValue ?
                            (int?)(currentDate.Year - o.UserDateOfBirth.Value.Year -
                            ((currentDate.Month < o.UserDateOfBirth.Value.Month) || (currentDate.Month == o.UserDateOfBirth.Value.Month && currentDate.Day < o.UserDateOfBirth.Value.Day) ? 1 : 0))
                            : null
                    })
                    .ToList() 
                    .Select(o => {
                        var age = o.Age;
                        var bracket = age >= 30 ? "30+" :
                                      age >= 25 ? "25-29" :
                                      age >= 20 ? "20-24" :
                                      age >= 0 ? "0-19" : "Unspecified";
                        return new { AgeBracket = bracket };
                    })
                    .GroupBy(x => x.AgeBracket)
                    .Select(group => new { AgeBracket = group.Key, Count = group.Count() })
                    .ToDictionary(x => x.AgeBracket, x => x.Count)
            };

            result.DateStamp = DateTimeOffset.UtcNow;
            return result;
        }
        #endregion

        #region Private Members
        private IQueryable<MyOpportunity.Models.MyOpportunity> MyOpportunityQueryBase(OrganizationSearchFilterSummary filter)
        {
            //organization
            var result = _myOpportunityRepository.Query(true).Where(o => o.OrganizationId == filter.Organization);

            //opportunities
            if (filter.Opportunities != null && filter.Opportunities.Any())
            {
                filter.Opportunities = filter.Opportunities.Distinct().ToList();
                result = result.Where(o => filter.Opportunities.Contains(o.OpportunityId));
            }

            //categories
            if (filter.Categories != null && filter.Categories.Any())
            {
                filter.Categories = filter.Categories.Distinct().ToList();
                result = result.Where(opportunity => _opportunityCategoryRepository.Query().Any(
                    opportunityCategory => filter.Categories.Contains(opportunityCategory.CategoryId) && opportunityCategory.OpportunityId == opportunity.OpportunityId));
            }

            //date range
            filter.StartDate = filter.StartDate.RemoveTime();
            filter.EndDate = filter.EndDate.ToEndOfDay();
            result = result.Where(o => o.DateModified >= filter.StartDate);
            result = result.Where(o => o.DateModified <= filter.EndDate);

            return result;
        }

        private IQueryable<MyOpportunity.Models.MyOpportunity> MyOpportunityQueryViewed(IQueryable<MyOpportunity.Models.MyOpportunity> queryBase)
        {
            var actionId = _myOpportunityActionService.GetByName(MyOpportunity.Action.Viewed.ToString()).Id;
            var opportunityStatusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
            var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;

            var result = queryBase.Where(o => o.ActionId == actionId);

            result = result.Where(o => o.OpportunityStatusId == opportunityStatusActiveId);
            result = result.Where(o => o.OrganizationStatusId == organizationStatusActiveId);

            return result;
        }

        private IQueryable<MyOpportunity.Models.MyOpportunity> MyOpportunityQueryPending(IQueryable<MyOpportunity.Models.MyOpportunity> queryBase)
        {
            var actionId = _myOpportunityActionService.GetByName(MyOpportunity.Action.Verification.ToString()).Id;
            var opportunityStatusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
            var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
            var opportunityStatusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;
            var verificationStatusId = _myOpportunityVerificationStatusService.GetByName(MyOpportunity.VerificationStatus.Pending.ToString()).Id;

            var result = queryBase.Where(o => o.ActionId == actionId);

            var predicate = PredicateBuilder.False<MyOpportunity.Models.MyOpportunity>();
            predicate.Or(o => o.VerificationStatusId == verificationStatusId && ((o.OpportunityStatusId == opportunityStatusActiveId && o.DateStart <= DateTimeOffset.UtcNow) ||
                               o.OpportunityStatusId == opportunityStatusExpiredId) && o.OrganizationStatusId == organizationStatusActiveId);

            var queryPending = result.Where(predicate);

            return result;
        }

        private IQueryable<MyOpportunity.Models.MyOpportunity> MyOpportunityQueryCompleted(IQueryable<MyOpportunity.Models.MyOpportunity> queryBase)
        {
            var actionId = _myOpportunityActionService.GetByName(MyOpportunity.Action.Verification.ToString()).Id;
            var verificationStatusId = _myOpportunityVerificationStatusService.GetByName(MyOpportunity.VerificationStatus.Completed.ToString()).Id;

            var result = queryBase.Where(o => o.ActionId == actionId);

            result = result.Where(o => o.VerificationStatusId == verificationStatusId);

            return result;
        }
        #endregion
    }
}
