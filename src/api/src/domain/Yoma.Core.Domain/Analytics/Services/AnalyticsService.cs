using Yoma.Core.Domain.Analytics.Interfaces;
using Yoma.Core.Domain.Analytics.Models;
using Yoma.Core.Domain.Analytics.Validators;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Analytics.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        #region Class Variables
        private readonly IOrganizationService _organizationService;
        private readonly IMyOpportunityActionService _myOpportunityActionService;
        private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;

        private readonly OrganizationSearchFilterSummaryValidator _organizationSearchFilterSummaryValidator;

        private readonly IRepositoryBatchedValueContainsWithNavigation<Opportunity.Models.Opportunity> _opportunityRepository;
        private readonly IRepositoryBatchedWithNavigation<MyOpportunity.Models.MyOpportunity> _myOpportunityRepository;
        private readonly IRepository<OpportunityCategory> _opportunityCategoryRepository;
        private readonly IRepository<OpportunityCountry> _opportunityCountryRepository;

        private const int Skill_Count = 10;
        private const int Country_Count = 5;
        private const string Gender_Group_Default = "Other";
        private const string AgeBracket_Group_Default = "Unspecified";
        #endregion

        #region Constructor
        public AnalyticsService(IOrganizationService organizationService,
            IMyOpportunityActionService myOpportunityActionService,
            IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
            OrganizationSearchFilterSummaryValidator organizationSearchFilterSummaryValidator,
            IRepositoryBatchedValueContainsWithNavigation<Opportunity.Models.Opportunity> opportunityRepository,
            IRepositoryBatchedWithNavigation<MyOpportunity.Models.MyOpportunity> myOpportunityRepository,
            IRepository<OpportunityCategory> opportunityCategoryRepository,
            IRepository<OpportunityCountry> opportunityCountryRepository)
        {
            _organizationService = organizationService;
            _myOpportunityActionService = myOpportunityActionService;
            _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
            _organizationSearchFilterSummaryValidator = organizationSearchFilterSummaryValidator;
            _opportunityRepository = opportunityRepository;
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

            _organizationSearchFilterSummaryValidator.Validate(filter);

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

            //opportunities selected
            result.Opportunities.Selected = new OpportunitySelected { Legend = "Opportunities selected", Count = OpportunityQueryBase(filter).Count() };

            //average time
            var dates = queryCompleted
                 .Where(o => o.DateStart.HasValue && o.DateEnd.HasValue)
                 .Select(o => new { o.DateStart, o.DateEnd })
                 .ToList();

            var averageCompletionTimeInDays = dates
                .Select(o => (o.DateEnd!.Value - o.DateStart!.Value).TotalDays)
                .DefaultIfEmpty(0)
                .Average();

            result.Opportunities.Completion = new OpportunityCompletion { Legend = "Average time (days)", AverageTimeInDays = (int)Math.Round(averageCompletionTimeInDays) };

            //converstion rate
            result.Opportunities.ConversionRate = new OpportunityConversionRate { Legend = "Conversion rate", ViewedCount = viewedCount, CompletedCount = completedCount, Percentage = completedCount / viewedCount * 100 };

            //zlto rewards
            var totalRewards = queryCompleted.Sum(o => o.ZltoReward ?? 0);
            result.Opportunities.Reward = new OpportunityReward { Legend = "ZLTO amount awarded", TotalAmount = totalRewards };

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
                TopCompleted = new OpportunitySkillTopCompleted { Legend = "Most completed skills", TopCompleted = flattenedSkills.Take(Skill_Count).Select(g => g.Skill).OrderBy(s => s.Name).ToList() },
                Items = new TimeIntervalSummary()
                { Legend = new[] { "Total unique skills", }, Data = resultsSkills, Count = new[] { itemSkills.Sum(o => o.Count) } }
            };

            //demogrpahics
            var currentDate = DateTimeOffset.UtcNow;
            result.Demographics = new OrganizationDemographic
            {
                //countries
                Countries = new Demographic
                {
                    Legend = "Country",
                    Items = queryCompleted
                    .Join(_opportunityCountryRepository.Query(),
                        opportunity => opportunity.OpportunityId,
                        countryInfo => countryInfo.OpportunityId,
                        (opportunity, countryInfo) => new { opportunity, countryInfo.CountryName })
                    .GroupBy(opportunity => opportunity.CountryName)
                    .Select(g => new { CountryName = g.Key, Count = g.Count() })
                    .OrderByDescending(country => country.Count)
                    .Take(Country_Count)
                    .OrderBy(country => country.CountryName)
                    .ToDictionary(country => country.CountryName, country => country.Count)
                },

                //gender
                Genders = new Demographic
                {
                    Legend = "Gender",
                    Items = queryCompleted
                    .GroupBy(opportunity =>
                        string.IsNullOrEmpty(opportunity.UserGender) || opportunity.UserGender.ToLower() == Core.Gender.PreferNotToSay.ToDescription().ToLower()
                            ? Gender_Group_Default
                            : opportunity.UserGender)
                    .Select(group => new { UserGender = group.Key, Count = group.Count() })
                    .OrderBy(gender => gender.UserGender.ToLower() == Gender_Group_Default.ToLower() ? 1 : 0)
                    .ThenBy(gender => gender.UserGender)
                    .ToDictionary(gender => gender.UserGender, gender => gender.Count)
                },

                //age
                Ages = new Demographic
                {
                    Legend = "Age",
                    Items = queryCompleted
                    .Select(o => new
                    {
                        o.UserDateOfBirth,
                        Age = o.UserDateOfBirth.HasValue ?
                            (int?)(currentDate.Year - o.UserDateOfBirth.Value.Year -
                            ((currentDate.Month < o.UserDateOfBirth.Value.Month) || (currentDate.Month == o.UserDateOfBirth.Value.Month && currentDate.Day < o.UserDateOfBirth.Value.Day) ? 1 : 0))
                            : null
                    })
                    .ToList()
                    .Select(o =>
                    {
                        var age = o.Age;
                        var bracket = age >= 30 ? "30+" :
                                      age >= 25 ? "25-29" :
                                      age >= 20 ? "20-24" :
                                      age >= 0 ? "0-19" : AgeBracket_Group_Default;
                        return new { AgeBracket = bracket };
                    })
                    .GroupBy(bracket => bracket.AgeBracket)
                    .Select(group => new { AgeBracket = group.Key, Count = group.Count() })
                    .OrderBy(age => age.AgeBracket.ToLower() == AgeBracket_Group_Default.ToLower() ? int.MaxValue : (age.AgeBracket.Contains("30+") ? 30 : int.Parse(age.AgeBracket.Split('-')[0])))
                    .ToDictionary(age => age.AgeBracket, age => age.Count)
                }
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
            if (filter.StartDate.HasValue)
            {
                var startDate = filter.StartDate.Value.RemoveTime();
                result = result.Where(o => !o.DateStart.HasValue || o.DateStart >= startDate);
            }

            if (filter.EndDate.HasValue)
            {
                var endDate = filter.EndDate.Value.ToEndOfDay();
                result = result.Where(o => !o.DateEnd.HasValue || o.DateEnd <= endDate);
            }

            return result;
        }

        private IQueryable<MyOpportunity.Models.MyOpportunity> MyOpportunityQueryViewed(IQueryable<MyOpportunity.Models.MyOpportunity> queryBase)
        {
            var actionId = _myOpportunityActionService.GetByName(MyOpportunity.Action.Viewed.ToString()).Id;
            //include all states; don't filter on active opportunity and / or active organization; should see all hisatorical views

            var result = queryBase.Where(o => o.ActionId == actionId);

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

        private IQueryable<Opportunity.Models.Opportunity> OpportunityQueryBase(OrganizationSearchFilterSummary filter)
        {
            //organization
            var result = _opportunityRepository.Query(true).Where(o => o.OrganizationId == filter.Organization);

            //opportunities
            if (filter.Opportunities != null && filter.Opportunities.Any())
            {
                filter.Opportunities = filter.Opportunities.Distinct().ToList();
                result = result.Where(o => filter.Opportunities.Contains(o.Id));
            }

            //categories
            if (filter.Categories != null && filter.Categories.Any())
            {
                filter.Categories = filter.Categories.Distinct().ToList();
                result = result.Where(opportunity => _opportunityCategoryRepository.Query().Any(
                    opportunityCategory => filter.Categories.Contains(opportunityCategory.CategoryId) && opportunityCategory.OpportunityId == opportunity.Id));
            }

            //date range
            if (filter.StartDate.HasValue)
            {
                filter.StartDate = filter.StartDate.RemoveTime();
                result = result.Where(o => o.DateStart >= filter.StartDate);
            }

            if (filter.EndDate.HasValue)
            {
                filter.EndDate = filter.EndDate.ToEndOfDay();
                result = result.Where(o => !o.DateEnd.HasValue || o.DateEnd <= filter.EndDate);
            }

            return result;
        }
        #endregion
    }
}
