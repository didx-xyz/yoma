using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Analytics.Interfaces;
using Yoma.Core.Domain.Analytics.Models;
using Yoma.Core.Domain.Analytics.Validators;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Analytics.Services
{
  public class AnalyticsService : IAnalyticsService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private readonly IOrganizationService _organizationService;
    private readonly IMyOpportunityActionService _myOpportunityActionService;
    private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
    private readonly IBlobService _blobService;
    private readonly ICountryService _countryService;

    private readonly OrganizationSearchFilterEngagementValidator _organizationSearchFilterEngagementValidator;
    private readonly OrganizationSearchFilterOpportunityValidator _organizationSearchFilterOpportunityValidator;
    private readonly OrganizationSearchFilterYouthValidator _organizationSearchFilterYouthValidator;
    private readonly OrganizationSearchFilterSSOValidator _organizationSearchFilterSSOValidator;

    private readonly IRepositoryBatchedValueContainsWithNavigation<Opportunity.Models.Opportunity> _opportunityRepository;
    private readonly IRepositoryBatchedWithNavigation<MyOpportunity.Models.MyOpportunity> _myOpportunityRepository;
    private readonly IRepository<OpportunityCategory> _opportunityCategoryRepository;
    private readonly IRepository<UserLoginHistory> _userLoginHistoryRepository;
    private readonly IRepositoryBatchedValueContainsWithNavigation<Organization> _organizationRepository;

    private const int Skill_Count = 10;
    private const int Country_Count = 5;
    private const string Education_Group_Default = "Unspecified";
    private const string Gender_Group_Default = "Other";
    private const string Country_Group_Default = "Unspecified";
    private const string AgeBracket_Group_Default = "Unspecified";
    #endregion

    #region Constructor
    public AnalyticsService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IHttpContextAccessor httpContextAccessor,
        IOrganizationService organizationService,
        IMyOpportunityActionService myOpportunityActionService,
        IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
        IBlobService blobService,
        ICountryService countryService,
        OrganizationSearchFilterEngagementValidator organizationSearchFilterEngagementValidator,
        OrganizationSearchFilterOpportunityValidator organizationSearchFilterOpportunityValidator,
        OrganizationSearchFilterYouthValidator organizationSearchFilterYouthValidator,
        OrganizationSearchFilterSSOValidator organizationSearchFilterSSOValidator,
        IRepositoryBatchedValueContainsWithNavigation<Opportunity.Models.Opportunity> opportunityRepository,
        IRepositoryBatchedWithNavigation<MyOpportunity.Models.MyOpportunity> myOpportunityRepository,
        IRepository<OpportunityCategory> opportunityCategoryRepository,
        IRepository<UserLoginHistory> userLoginHistoryRepository,
        IRepositoryBatchedValueContainsWithNavigation<Organization> organizationRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _httpContextAccessor = httpContextAccessor;
      _organizationService = organizationService;
      _myOpportunityActionService = myOpportunityActionService;
      _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
      _blobService = blobService;
      _countryService = countryService;
      _organizationSearchFilterEngagementValidator = organizationSearchFilterEngagementValidator;
      _organizationSearchFilterOpportunityValidator = organizationSearchFilterOpportunityValidator;
      _organizationSearchFilterYouthValidator = organizationSearchFilterYouthValidator;
      _organizationSearchFilterSSOValidator = organizationSearchFilterSSOValidator;
      _opportunityRepository = opportunityRepository;
      _myOpportunityRepository = myOpportunityRepository;
      _opportunityCategoryRepository = opportunityCategoryRepository;
      _userLoginHistoryRepository = userLoginHistoryRepository;
      _organizationRepository = organizationRepository;
    }
    #endregion

    #region Public Members
    public List<Lookups.Models.Country> ListSearchCriteriaCountriesEngaged(List<Guid>? organizations)  //ensureOrganizationAuthorization by default
    {
      organizations = organizations?.Distinct().ToList();
      if (organizations?.Count == 0) organizations = null;

      if (organizations != null)
        _organizationService.EnsureExist(organizations, true);

      EnsureOrganizationAuthorization(organizations);

      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Analytics))
        return ListSearchCriteriaCountriesEngagedInternal(organizations);

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Lookups.Models.Country>(organizations ?? []), entry =>
      {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(_appSettings.CacheAbsoluteExpirationRelativeToNowInHoursAnalytics);
        return ListSearchCriteriaCountriesEngagedInternal(organizations);
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached '{nameof(ListSearchCriteriaCountriesEngagedInternal)}s'");
      return result;
    }

    public OrganizationSearchResultsEngagement SearchOrganizationEngagement(OrganizationSearchFilterEngagement filter) //ensureOrganizationAuthorization by default
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      filter.SanitizeCollections();

      _organizationSearchFilterEngagementValidator.ValidateAndThrow(filter);

      EnsureOrganizationAuthorization(filter.Organizations);

      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Analytics))
        return SearchOrganizationEngagementInternal(filter);

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<OrganizationSearchResultsEngagement>(HashHelper.ComputeSHA256Hash(filter)), entry =>
      {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(_appSettings.CacheAbsoluteExpirationRelativeToNowInHoursAnalytics);
        return SearchOrganizationEngagementInternal(filter);
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached '{nameof(OrganizationSearchResultsEngagement)}s'");
      return result;
    }

    public OrganizationSearchResultsOpportunity SearchOrganizationOpportunities(OrganizationSearchFilterOpportunity filter) //ensureOrganizationAuthorization by default
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      filter.SanitizeCollections();

      _organizationSearchFilterOpportunityValidator.ValidateAndThrow(filter);

      EnsureOrganizationAuthorization(filter.Organizations);

      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Analytics))
        return SearchOrganizationOpportunitiesInternal(filter);

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<OrganizationSearchResultsOpportunity>(HashHelper.ComputeSHA256Hash(filter)), entry =>
      {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(_appSettings.CacheAbsoluteExpirationRelativeToNowInHoursAnalytics);
        return SearchOrganizationOpportunitiesInternal(filter);
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached '{nameof(OrganizationSearchResultsOpportunity)}s'");
      return result;
    }

    public OrganizationSearchResultsYouth SearchOrganizationYouth(OrganizationSearchFilterYouth filter) //ensureOrganizationAuthorization by default
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      filter.SanitizeCollections();

      _organizationSearchFilterYouthValidator.ValidateAndThrow(filter);

      EnsureOrganizationAuthorization(filter.Organizations);

      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Analytics))
        return SearchOrganizationYouthInternal(filter);

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<OrganizationSearchResultsYouth>(HashHelper.ComputeSHA256Hash(filter)), entry =>
      {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(_appSettings.CacheAbsoluteExpirationRelativeToNowInHoursAnalytics);
        return SearchOrganizationYouthInternal(filter);
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached '{nameof(OrganizationSearchResultsYouth)}s'");
      return result;
    }

    public OrganizationSearchResultsSSO SearchOrganizationSSO(OrganizationSearchFilterSSO filter) //ensureOrganizationAuthorization by default
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      filter.SanitizeCollections();

      _organizationSearchFilterSSOValidator.ValidateAndThrow(filter);

      EnsureOrganizationAuthorization(filter.Organizations);

      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Analytics))
        return SearchOrganizationSSOInternal(filter);

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<OrganizationSearchResultsSSO>(HashHelper.ComputeSHA256Hash(filter)), entry =>
      {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(_appSettings.CacheAbsoluteExpirationRelativeToNowInHoursAnalytics);
        return SearchOrganizationSSOInternal(filter);
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached '{nameof(OrganizationSearchResultsSSO)}s'");
      return result;
    }
    #endregion

    #region Private Members
    private string? GetBlobObjectURL(StorageType? storageType, string? key)
    {
      if (!storageType.HasValue || string.IsNullOrEmpty(key)) return null;
      return _blobService.GetURL(storageType.Value, key);
    }

    private void EnsureOrganizationAuthorization(List<Guid>? organizations)
    {
      if (HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) return;

      if (organizations is not { Count: > 0 })
        throw new ValidationException($"One or more organizations are required for '{Constants.Role_OrganizationAdmin}' role only");

      _organizationService.IsAdminsOf(organizations, true);
    }

    private List<Lookups.Models.Country> ListSearchCriteriaCountriesEngagedInternal(List<Guid>? organizations)
    {
      var query = _myOpportunityRepository.Query(true);

      if (organizations != null && organizations.Count != 0)
        query = query.Where(o => organizations.Contains(o.OrganizationId));

      var actionIdViewed = _myOpportunityActionService.GetByName(MyOpportunity.Action.Viewed.ToString()).Id;
      var actionIdNavigatedExternalLink = _myOpportunityActionService.GetByName(MyOpportunity.Action.NavigatedExternalLink.ToString()).Id;
      var actionIdCompleted = _myOpportunityActionService.GetByName(MyOpportunity.Action.Verification.ToString()).Id;
      var verificationStatusId = _myOpportunityVerificationStatusService.GetByName(MyOpportunity.VerificationStatus.Completed.ToString()).Id;

      query = query.Where(o => o.ActionId == actionIdViewed || o.ActionId == actionIdNavigatedExternalLink || (o.ActionId == actionIdCompleted && o.VerificationStatusId == verificationStatusId));

      var countryIds = query.Select(o => o.UserCountryId).Distinct().ToList();

      return [.. _countryService.List().Where(o => countryIds.Contains(o.Id))
                .OrderBy(o => o.CodeAlpha2 != Country.Worldwide.ToDescription()).ThenBy(o => o.Name)]; //ensure Worldwide appears first
    }

    private OrganizationSearchResultsEngagement SearchOrganizationEngagementInternal(OrganizationSearchFilterEngagement filter)
    {
      var queryBase = MyOpportunityQueryBase(filter);

      //'my' opportunities: viewed
      var queryViewed = MyOpportunityQueryViewed(filter, queryBase);

      var itemsViewed = queryViewed
          .Select(opportunity => new { opportunity.DateModified })
          .ToList() //transition to client-side processing avoiding translation issue : function pg_catalog.timezone(unknown, interval) does not exist
          .Select(item => new
          {
            WeekEnding = item.DateModified.AddDays(-(int)item.DateModified.DayOfWeek).AddDays(7).Date
          })
          .GroupBy(x => x.WeekEnding)
          .Select(group => new
          {
            WeekEnding = group.Key,
            Count = group.Count()
          })
          .OrderBy(result => result.WeekEnding)
          .ToList();

      var resultsViewed = new List<TimeValueEntry>();
      itemsViewed.ForEach(o => { resultsViewed.Add(new TimeValueEntry(o.WeekEnding, o.Count, default(int), default(int))); });

      //'my' opportunities: navigated external link
      var queryNavigatedExternalLink = MyOpportunityQueryNavigatedExternalLink(filter, queryBase);

      var itemsNavigatedExternalLink = queryNavigatedExternalLink
          .Select(opportunity => new { opportunity.DateModified })
          .ToList() //transition to client-side processing avoiding translation issue : function pg_catalog.timezone(unknown, interval) does not exist
          .Select(item => new
          {
            WeekEnding = item.DateModified.AddDays(-(int)item.DateModified.DayOfWeek).AddDays(7).Date
          })
          .GroupBy(x => x.WeekEnding)
          .Select(group => new
          {
            WeekEnding = group.Key,
            Count = group.Count()
          })
          .OrderBy(result => result.WeekEnding)
          .ToList();

      var resultsNavigatedExternalLink = new List<TimeValueEntry>();
      itemsNavigatedExternalLink.ForEach(o => { resultsNavigatedExternalLink.Add(new TimeValueEntry(o.WeekEnding, default(int), o.Count, default(int))); });

      //'my' opportunities: completed
      var queryCompleted = MyOpportunityQueryCompleted(filter, queryBase);

      var itemsCompleted = queryCompleted
        .Select(opportunity => new { opportunity.DateModified })
        .ToList() //transition to client-side processing avoiding translation issue : function pg_catalog.timezone(unknown, interval) does not exist
        .Select(item => new
        {
          WeekEnding = item.DateModified.AddDays(-(int)item.DateModified.DayOfWeek).AddDays(7).Date
        })
        .GroupBy(x => x.WeekEnding)
        .Select(group => new
        {
          WeekEnding = group.Key,
          Count = group.Count()
        })
        .OrderBy(result => result.WeekEnding)
        .ToList();

      var resultsCompleted = new List<TimeValueEntry>();
      itemsCompleted.ForEach(o => { resultsCompleted.Add(new TimeValueEntry(o.WeekEnding, default(int), default(int), o.Count)); });

      //engagement
      //'my' opportunity engagements: viewed, navigatedExternalLink & completed combined
      var resultsEngagements = resultsViewed.Concat(resultsNavigatedExternalLink).Concat(resultsCompleted)
          .GroupBy(e => e.Date)
          .Select(g => new TimeValueEntry(
              g.Key,
              g.Sum(e => Convert.ToInt32(e.Values[0])), //viewed
              g.Sum(e => Convert.ToInt32(e.Values[1])), //navigatedExternalLink
              g.Sum(e => Convert.ToInt32(e.Values[2]))  //completed
          ))
          .OrderByDescending(e => e.Date)
          .Take(Constants.TimeIntervalSummary_Data_MaxNoOfPoints)
          .Reverse()
          .ToList();

      //results
      var result = new OrganizationSearchResultsEngagement { Opportunities = new OrganizationOpportunity() };

      var viewedCount = itemsViewed.Sum(o => o.Count);
      var navigatedExternalLinkCount = itemsNavigatedExternalLink.Sum(o => o.Count);
      var completedCount = itemsCompleted.Sum(o => o.Count);

      //'my' opportunity engagements: viewed, navigatedExternalLink & completed verifications
      result.Opportunities.Engagements = new TimeIntervalSummary()
      { Legend = ["Viewed", "Go-To Clicks", "Completions"], Data = resultsEngagements, Count = [viewedCount, navigatedExternalLinkCount, completedCount] };

      //opportunities engaged
      var opportunityCountEngaged =
        queryViewed.Select(o => o.OpportunityId) //viewed
        .Union(queryNavigatedExternalLink.Select(o => o.OpportunityId)) //navigatedExternalLink
        .Union(queryCompleted.Select(o => o.OpportunityId)) //completed
        .Distinct().Count();
      result.Opportunities.Engaged = new OpportunityEngaged { Legend = "Opportunities engaged", Count = opportunityCountEngaged };

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

      //average conversation rate
      //var items = SearchOrganizationOpportunitiesQueryBase(new OrganizationSearchFilterOpportunity
      //{
      //  Organization = filter.Organization,
      //  Opportunities = filter.Opportunities,
      //  Categories = filter.Categories,
      //  StartDate = filter.StartDate,
      //  EndDate = filter.EndDate

      //}).ToList();

      result.Opportunities.ConversionRate = new OpportunityConversionRatio
      {
        ViewedCount = viewedCount,
        CompletedCount = completedCount,
        NavigatedExternalLinkCount = navigatedExternalLinkCount,

        //percentage of users who viewed and then navigated to an external link
        ViewedToNavigatedExternalLinkPercentage = viewedCount > 0 ? Math.Min(100M, Math.Round((decimal)navigatedExternalLinkCount / viewedCount * 100, 2)) : (navigatedExternalLinkCount > 0 ? 100M : 0M),

        //percentage of users who navigated to an external link and then completed
        NavigatedExternalLinkToCompletedPercentage = navigatedExternalLinkCount > 0 ? Math.Min(100M, Math.Round((decimal)completedCount / navigatedExternalLinkCount * 100, 2)) : (completedCount > 0 ? 100M : 0M)
      };

      //zlto rewards
      var totalRewards = queryCompleted.Sum(o => o.ZltoReward ?? 0);
      result.Opportunities.Reward = new OpportunityReward { Legend = "ZLTO amount awarded", TotalAmount = totalRewards };

      //skills
      var skills = queryCompleted.Select(o => new { o.DateModified, o.Skills }).ToList();

      var flattenedSkills = skills
           .SelectMany(o => o.Skills ?? [])
           .GroupBy(skill => skill.Id)
           .Select(g => new { Skill = g.First(), Count = g.Count() })
           .OrderByDescending(g => g.Count)
           .ToList();

      var itemSkills = skills
          .SelectMany(o => (o.Skills ?? []).Select(skill => new { o.DateModified, SkillId = skill.Id }))
          .GroupBy(x => x.DateModified.AddDays(-(int)x.DateModified.DayOfWeek).AddDays(7).Date)
          .Select(group => new
          {
            WeekEnding = group.Key,
            Count = group.Select(x => x.SkillId).Distinct().Count()
          })
          .OrderByDescending(result => result.WeekEnding)
          .Take(Constants.TimeIntervalSummary_Data_MaxNoOfPoints)
          .Reverse()
          .ToList();

      var resultsSkills = new List<TimeValueEntry>();
      itemSkills.ForEach(o => { resultsSkills.Add(new TimeValueEntry(o.WeekEnding, o.Count)); });
      result.Skills = new OrganizationOpportunitySkill
      {
        TopCompleted = new OpportunitySkillTopCompleted
        {
          Legend = "Most completed skills",
          TopCompleted = [.. flattenedSkills.Take(Skill_Count).Select(g => new OpportunitySkillCompleted
        {
          Id = g.Skill.Id,
          Name = g.Skill.Name,
          InfoURL = g.Skill.InfoURL,
          CountCompleted = g.Count
        }).OrderBy(s => s.Name)]
        },
        Items = new TimeIntervalSummary()
        { Legend = ["Total unique skills"], Data = resultsSkills, Count = [flattenedSkills.Count] }
      };

      //demographics
      var currentDate = DateTimeOffset.UtcNow;
#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      result.Demographics = new OrganizationDemographic
      {
        //education
        Education = new Demographic
        {
          Legend = "Education",
          Items = queryCompleted
              .GroupBy(opportunity =>
                  string.IsNullOrEmpty(opportunity.UserEducation)
                      ? Education_Group_Default
                      : opportunity.UserEducation)
              .Select(group => new { UserEducation = group.Key, Count = group.Count() })
              .OrderBy(education => education.UserEducation.ToLower() == Education_Group_Default.ToLower() ? int.MaxValue : 0)
              .ThenBy(education => education.UserEducation)
              .ToDictionary(education => education.UserEducation, education => education.Count)
        },

        //countries
        Countries = new Demographic
        {
          Legend = "Country",
          Items = queryCompleted
              .GroupBy(opportunity =>
                  string.IsNullOrEmpty(opportunity.UserCountry)
                      ? Country_Group_Default
                      : opportunity.UserCountry)
              .Select(group => new { UserCountry = group.Key, Count = group.Count() })
              .OrderBy(country => country.UserCountry.ToLower() == Country_Group_Default.ToLower() ? int.MaxValue : 0)
              .ThenBy(country => country.UserCountry)
              .ToDictionary(country => country.UserCountry, country => country.Count)
        },

        //gender
        Genders = new Demographic
        {
          Legend = "Gender",
          Items = queryCompleted
              .GroupBy(opportunity =>
                  string.IsNullOrEmpty(opportunity.UserGender) || opportunity.UserGender.ToLower() == Gender.PreferNotToSay.ToDescription().ToLower()
                      ? Gender_Group_Default
                      : opportunity.UserGender)
              .Select(group => new { UserGender = group.Key, Count = group.Count() })
              .OrderBy(gender => gender.UserGender.ToLower() == Gender_Group_Default.ToLower() ? int.MaxValue : 0)
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
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons

      //cumulative data: Monthly completion counts per organization
      var itemsCumulative = MyOpportunityQueryCompleted(filter, queryBase)
        .Select(o => new { o.OrganizationName, o.DateModified })
        .ToList() //transition to client-side processing avoiding translation issue : function pg_catalog.timezone(unknown, interval) does not exist
        .GroupBy(x => new
        {
          x.OrganizationName,
          MonthEnding = new DateTime(x.DateModified.Year, x.DateModified.Month, 1, 0, 0, 0).AddMonths(1).AddDays(-1)
        })
        .Select(group => new
        {
          group.Key.OrganizationName,
          group.Key.MonthEnding,
          Count = group.Count()
        })
        .OrderBy(result => result.MonthEnding)
        .ThenBy(result => result.OrganizationName)
        .ToList();

      //extract unique organization names in alphabetical order for the Legend
      var organizationNames = itemsCumulative.Select(x => x.OrganizationName).Distinct().OrderBy(name => name).ToArray();

      //prepare cumulative results grouped by MonthEnding
      var resultsCumulative = new List<TimeValueEntry>();
      itemsCumulative
        .GroupBy(o => o.MonthEnding)
        .ToList()
        .ForEach(group =>
        {
          //generate the values/counts for all organization names in the current month-ending group
          var values = organizationNames.Select(name => group.SingleOrDefault(o => o.OrganizationName == name)?.Count ?? 0).ToArray();
          resultsCumulative.Add(new TimeValueEntry(group.Key, values));
        });

      //finalize the cumulative summary
      result.Cumulative = new OrganizationCumulative
      {
        Completions = new TimeIntervalSummary
        {
          Legend = organizationNames,
          Data = resultsCumulative,
          Count = organizationNames.Select(name => itemsCumulative.Where(o => o.OrganizationName == name).Sum(o => o.Count)).ToArray()
        }
      };

      result.DateStamp = DateTimeOffset.UtcNow;
      return result;
    }

    private OrganizationSearchResultsOpportunity SearchOrganizationOpportunitiesInternal(OrganizationSearchFilterOpportunity filter)
    {
      var query = SearchOrganizationOpportunitiesQueryBase(filter);

      query = query.OrderByDescending(o => o.ConversionRatioPercentage).ThenBy(o => o.Title).ThenBy(o => o.Id); //ensure deterministic sorting / consistent pagination results

      var result = new OrganizationSearchResultsOpportunity();
      //pagination
      if (filter.PaginationEnabled)
      {
        result.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      result.Items = [.. query];
      result.Items.ForEach(o => o.OrganizationLogoURL = GetBlobObjectURL(o.OrganizationLogoStorageType, o.OrganizationLogoKey));

      result.DateStamp = DateTimeOffset.UtcNow;
      return result;
    }

    private OrganizationSearchResultsYouth SearchOrganizationYouthInternal(OrganizationSearchFilterYouth filter)
    {
      var query = MyOpportunityQueryCompleted(filter, MyOpportunityQueryBase(filter))
          .GroupBy(o => new { o.UserId, o.UserDisplayName, o.UserDateOfBirth, o.UserCountry })
          .Select(g => new
          {
            g.Key.UserId,
            g.Key.UserDisplayName,
            g.Key.UserDateOfBirth,
            g.Key.UserCountry,
            ZltoRewardTotal = g.Sum(o => o.ZltoReward ?? 0),
            YomaRewardTotal = g.Sum(o => o.YomaReward ?? 0),
            OpportunityCount = g.Count(),
            Opportunities = g.Select(o => new
            {
              Id = o.OpportunityId,
              Title = o.OpportunityTitle,
              Status = o.OpportunityStatus,
              o.OrganizationId,
              o.OrganizationLogoId,
              o.OrganizationLogoStorageType,
              o.OrganizationLogoKey,
              o.DateCompleted,
              o.OpportunityCredentialIssuanceEnabled
            })
          });

      var result = new OrganizationSearchResultsYouth();

      query = query.OrderByDescending(o => o.OpportunityCount)
        .ThenBy(o => o.UserDisplayName)
        .ThenBy(o => o.UserId); //ensure deterministic sorting / consistent pagination results

      //pagination
      if (filter.PaginationEnabled)
      {
        result.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      result.Items = query.ToList().Select(youth => new YouthInfo
      {
        Id = youth.UserId,
        DisplayName = youth.UserDisplayName,
        Country = youth.UserCountry,
        Age = youth.UserDateOfBirth?.CalculateAge(null),
        ZltoRewardTotal = youth.ZltoRewardTotal,
        YomaRewardTotal = youth.YomaRewardTotal,
        OpporunityCount = youth.OpportunityCount,
        Opportunities = youth.Opportunities.Select(op => new YouthInfoOpportunity
        {
          Id = op.Id,
          Title = op.Title,
          Status = op.Status,
          OrganizationId = op.OrganizationId,
          OrganizationLogoId = op.OrganizationLogoId,
          OrganizationLogoStorageType = op.OrganizationLogoStorageType,
          OrganizationLogoKey = op.OrganizationLogoKey,
          DateCompleted = op.DateCompleted,
          Verified = op.OpportunityCredentialIssuanceEnabled
        }).ToList()
      }).ToList();

      result.Items.ForEach(youthInfo => youthInfo.Opportunities.ForEach(
        opportunity => opportunity.OrganizationLogoURL = GetBlobObjectURL(opportunity.OrganizationLogoStorageType, opportunity.OrganizationLogoKey)));

      result.DateStamp = DateTimeOffset.UtcNow;
      return result;
    }

    private OrganizationSearchResultsSSO SearchOrganizationSSOInternal(OrganizationSearchFilterSSO filter)
    {
      var queryOrganization = _organizationRepository.Query();

      if (filter.Organizations != null && filter.Organizations.Count != 0)
        queryOrganization = queryOrganization.Where(o => filter.Organizations.Contains(o.Id));

      queryOrganization = queryOrganization.OrderBy(o => o.Name).ThenBy(o => o.Id); //ensure deterministic sorting / consistent pagination results

      var result = new OrganizationSearchResultsSSO();

      //pagination
      if (filter.PaginationEnabled)
      {
        result.TotalCount = queryOrganization.Count();
        queryOrganization = queryOrganization.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      result.Items = [.. queryOrganization
        .Select(o => new OrganizationSSOInfo
        {
          Id = o.Id,
          Name = o.Name,
          LogoId = o.LogoId,
          LogoStorageType = o.LogoStorageType,
          LogoKey = o.LogoKey,
          Outbound = new OrganizationSSO
          {
            Legend = "Outbound",
            ClientId = o.SSOClientIdOutbound
          },
          Inbound = new OrganizationSSO
          {
            Legend = "Inbound",
            ClientId = o.SSOClientIdInbound
          }
        })];

      var queryLogins = _userLoginHistoryRepository.Query();

      //date range
      if (filter.StartDate.HasValue)
      {
        var startDate = filter.StartDate.Value.RemoveTime();
        queryLogins = queryLogins.Where(o => o.DateCreated >= startDate);
      }

      if (filter.EndDate.HasValue)
      {
        var endDate = filter.EndDate.Value.ToEndOfDay();
        queryLogins = queryLogins.Where(o => o.DateCreated <= endDate);
      }

      foreach (var item in result.Items)
      {
        item.LogoURL = GetBlobObjectURL(item.LogoStorageType, item.LogoKey);
        if (item.Outbound.Enabled)
          item.Outbound.Logins = GetSSODistinctLoginSummary(queryLogins, item.Outbound.ClientId);

        if (item.Inbound.Enabled)
          item.Inbound.Logins = GetSSODistinctLoginSummary(queryLogins, item.Inbound.ClientId);
      }

      result.OutboundLoginCount = result.Items.Where(o => o.Outbound.Enabled).Sum(o => o.Outbound.Logins?.Count.First());
      result.InboundLoginCount = result.Items.Where(o => o.Inbound.Enabled).Sum(o => o.Inbound.Logins?.Count.First());

      result.DateStamp = DateTimeOffset.UtcNow;
      return result;
    }

    private static TimeIntervalSummary GetSSODistinctLoginSummary(IQueryable<UserLoginHistory> query, string? clientId)
    {
      ArgumentException.ThrowIfNullOrEmpty(clientId, nameof(clientId));

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      var loginsUniqueCount = query
        .Where(o => o.ClientId.ToLower() == clientId.ToLower())
        .Select(o => o.UserId)
        .Distinct()
        .Count();

      var loginsUniqueWeekly = query
        .Where(o => o.ClientId.ToLower() == clientId.ToLower())
        .Select(o => new { o.DateCreated, o.UserId })
        .GroupBy(x => x.DateCreated.AddDays(-(int)x.DateCreated.DayOfWeek).AddDays(7).Date)
        .Select(group => new
        {
          WeekEnding = group.Key,
          Count = group.Select(x => x.UserId).Distinct().Count()
        })
        .OrderByDescending(result => result.WeekEnding)
        .Take(Constants.TimeIntervalSummary_Data_MaxNoOfPoints)
        .Reverse()
        .ToList();
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons

      var resultsLogins = new List<TimeValueEntry>();
      loginsUniqueWeekly.ForEach(o => { resultsLogins.Add(new TimeValueEntry(o.WeekEnding, o.Count)); });

      return new TimeIntervalSummary { Legend = ["Login count"], Data = resultsLogins, Count = [loginsUniqueCount] };
    }

    private IQueryable<OpportunityInfoAnalytics> SearchOrganizationOpportunitiesQueryBase(OrganizationSearchFilterOpportunity filter)
    {
      return OpportunityQueryBase(filter)
          .Select(opportunity => new
          {
            Opportunity = opportunity,
            ViewedCount = _myOpportunityRepository.Query()
              .Where(mo => mo.OpportunityId == opportunity.Id &&
                           mo.ActionId == _myOpportunityActionService.GetByName(MyOpportunity.Action.Viewed.ToString()).Id &&
                           (!filter.StartDate.HasValue || mo.DateModified >= filter.StartDate.RemoveTime()) &&
                           (!filter.EndDate.HasValue || mo.DateModified <= filter.EndDate.ToEndOfDay()))
              .Count(),
            NavigatedExternalLinkCount = _myOpportunityRepository.Query()
              .Where(mo => mo.OpportunityId == opportunity.Id &&
                           mo.ActionId == _myOpportunityActionService.GetByName(MyOpportunity.Action.NavigatedExternalLink.ToString()).Id &&
                           (!filter.StartDate.HasValue || mo.DateModified >= filter.StartDate.RemoveTime()) &&
                           (!filter.EndDate.HasValue || mo.DateModified <= filter.EndDate.ToEndOfDay()))
              .Count(),
            CompletedCount = _myOpportunityRepository.Query()
              .Where(mo => mo.OpportunityId == opportunity.Id &&
                           mo.ActionId == _myOpportunityActionService.GetByName(MyOpportunity.Action.Verification.ToString()).Id &&
                           mo.VerificationStatusId == _myOpportunityVerificationStatusService.GetByName(MyOpportunity.VerificationStatus.Completed.ToString()).Id &&
                           (!filter.StartDate.HasValue || !mo.DateCompleted.HasValue || mo.DateCompleted >= filter.StartDate.RemoveTime()) &&
                           (!filter.EndDate.HasValue || !mo.DateCompleted.HasValue || mo.DateCompleted <= filter.EndDate.ToEndOfDay()))
              .Count()
          })
          .Select(result => new OpportunityInfoAnalytics
          {
            Id = result.Opportunity.Id,
            Title = result.Opportunity.Title,
            Status = result.Opportunity.Status,
            OrganizationId = result.Opportunity.OrganizationId,
            OrganizationLogoId = result.Opportunity.OrganizationLogoId,
            OrganizationLogoStorageType = result.Opportunity.OrganizationLogoStorageType,
            OrganizationLogoKey = result.Opportunity.OrganizationLogoKey,
            ViewedCount = result.ViewedCount,
            NavigatedExternalLinkCount = result.NavigatedExternalLinkCount,
            CompletedCount = result.CompletedCount,
            ConversionRatioPercentage = (result.ViewedCount > 0) ? Math.Min(100, Math.Round((decimal)result.CompletedCount / result.ViewedCount * 100, 2)) : (result.CompletedCount > 0 ? 100 : 0)
          });
    }

    private IQueryable<MyOpportunity.Models.MyOpportunity> MyOpportunityQueryBase(IOrganizationSearchFilterEngagement filter)
    {
      //organization
      var query = _myOpportunityRepository.Query(true);

      if (filter.Organizations != null && filter.Organizations.Count != 0)
        query = query.Where(o => filter.Organizations.Contains(o.OrganizationId));

      //opportunities
      if (filter.Opportunities != null && filter.Opportunities.Count != 0)
      {
        filter.Opportunities = filter.Opportunities.Distinct().ToList();
        query = query.Where(o => filter.Opportunities.Contains(o.OpportunityId));
      }

      //categories
      if (filter.Categories != null && filter.Categories.Count != 0)
      {
        filter.Categories = filter.Categories.Distinct().ToList();
        query = query.Where(opportunity => _opportunityCategoryRepository.Query().Any(
            opportunityCategory => filter.Categories.Contains(opportunityCategory.CategoryId) && opportunityCategory.OpportunityId == opportunity.OpportunityId));
      }

      //countries
      if (filter.Countries != null && filter.Countries.Count != 0)
      {
        filter.Countries = filter.Countries.Distinct().ToList();
        query = query.Where(o => o.UserCountryId.HasValue && filter.Countries.Contains(o.UserCountryId.Value));
      }

      return query;
    }

    private IQueryable<MyOpportunity.Models.MyOpportunity> MyOpportunityQueryViewed(IOrganizationSearchFilterBase filter, IQueryable<MyOpportunity.Models.MyOpportunity> queryBase)
    {
      //historical/admin context; include all irrespective of related opportunity and organization status
      var actionId = _myOpportunityActionService.GetByName(MyOpportunity.Action.Viewed.ToString()).Id;

      var query = queryBase.Where(o => o.ActionId == actionId);

      //date range
      if (filter.StartDate.HasValue)
      {
        var startDate = filter.StartDate.Value.RemoveTime();
        query = query.Where(o => o.DateModified >= startDate);
      }

      if (filter.EndDate.HasValue)
      {
        var endDate = filter.EndDate.Value.ToEndOfDay();
        query = query.Where(o => o.DateModified <= endDate);
      }

      return query;
    }

    private IQueryable<MyOpportunity.Models.MyOpportunity> MyOpportunityQueryNavigatedExternalLink(IOrganizationSearchFilterBase filter, IQueryable<MyOpportunity.Models.MyOpportunity> queryBase)
    {
      //historical/admin context; include all irrespective of related opportunity and organization status
      var actionId = _myOpportunityActionService.GetByName(MyOpportunity.Action.NavigatedExternalLink.ToString()).Id;

      var query = queryBase.Where(o => o.ActionId == actionId);

      //date range
      if (filter.StartDate.HasValue)
      {
        var startDate = filter.StartDate.Value.RemoveTime();
        query = query.Where(o => o.DateModified >= startDate);
      }

      if (filter.EndDate.HasValue)
      {
        var endDate = filter.EndDate.Value.ToEndOfDay();
        query = query.Where(o => o.DateModified <= endDate);
      }

      return query;
    }

    private IQueryable<MyOpportunity.Models.MyOpportunity> MyOpportunityQueryCompleted(IOrganizationSearchFilterBase filter, IQueryable<MyOpportunity.Models.MyOpportunity> queryBase)
    {
      //historical/admin context; all irrespective of related opportunity and organization status (default behaviour)
      var actionId = _myOpportunityActionService.GetByName(MyOpportunity.Action.Verification.ToString()).Id;
      var verificationStatusId = _myOpportunityVerificationStatusService.GetByName(MyOpportunity.VerificationStatus.Completed.ToString()).Id;

      var query = queryBase.Where(o => o.ActionId == actionId);

      query = query.Where(o => o.VerificationStatusId == verificationStatusId);

      //date range
      if (filter.StartDate.HasValue)
      {
        var startDate = filter.StartDate.Value.RemoveTime();
        query = query.Where(o => !o.DateCompleted.HasValue || o.DateCompleted >= startDate);
      }

      if (filter.EndDate.HasValue)
      {
        var endDate = filter.EndDate.Value.ToEndOfDay();
        query = query.Where(o => !o.DateCompleted.HasValue || o.DateCompleted <= endDate);
      }

      return query;
    }

    private IQueryable<Opportunity.Models.Opportunity> OpportunityQueryBase(IOrganizationSearchFilterBase filter)
    {
      var query = _opportunityRepository.Query(true);

      //organization
      if (filter.Organizations != null && filter.Organizations.Count != 0)
        query = query.Where(o => filter.Organizations.Contains(o.OrganizationId));

      //opportunities
      if (filter.Opportunities != null && filter.Opportunities.Count != 0)
      {
        filter.Opportunities = filter.Opportunities.Distinct().ToList();
        query = query.Where(o => filter.Opportunities.Contains(o.Id));
      }

      //categories
      if (filter.Categories != null && filter.Categories.Count != 0)
      {
        filter.Categories = filter.Categories.Distinct().ToList();
        query = query.Where(opportunity => _opportunityCategoryRepository.Query().Any(
            opportunityCategory => filter.Categories.Contains(opportunityCategory.CategoryId) && opportunityCategory.OpportunityId == opportunity.Id));
      }

      //date range include any opportunity that was active at any time within this period
      if (filter.StartDate.HasValue)
      {
        var startDate = filter.StartDate.Value.RemoveTime();
        // include opportunities where the end date is on or after the start date of the filter
        query = query.Where(o => !o.DateEnd.HasValue || o.DateEnd >= startDate);
      }

      if (filter.EndDate.HasValue)
      {
        var endDate = filter.EndDate.Value.ToEndOfDay();
        // include opportunities where the start date is on or before the end date of the filter
        query = query.Where(o => o.DateStart <= endDate);
      }

      return query;
    }
    #endregion
  }
}
