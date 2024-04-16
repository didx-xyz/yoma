using FluentValidation;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Analytics.Interfaces;
using Yoma.Core.Domain.Analytics.Models;
using Yoma.Core.Domain.Analytics.Validators;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Analytics.Services
{
  public class AnalyticsService : IAnalyticsService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;

    private readonly IOrganizationService _organizationService;
    private readonly IMyOpportunityActionService _myOpportunityActionService;
    private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
    private readonly IBlobService _blobService;

    private readonly OrganizationSearchFilterEngagementValidator _organizationSearchFilterEngagementValidator;
    private readonly OrganizationSearchFilterOpportunityValidator _organizationSearchFilterOpportunityValidator;
    private readonly OrganizationSearchFilterYouthValidator _organizationSearchFilterYouthValidator;

    private readonly IRepositoryBatchedValueContainsWithNavigation<Opportunity.Models.Opportunity> _opportunityRepository;
    private readonly IRepositoryBatchedWithNavigation<MyOpportunity.Models.MyOpportunity> _myOpportunityRepository;
    private readonly IRepository<OpportunityCategory> _opportunityCategoryRepository;

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
        IOrganizationService organizationService,
        IMyOpportunityActionService myOpportunityActionService,
        IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
        IBlobService blobService,
        OrganizationSearchFilterEngagementValidator organizationSearchFilterEngagementValidator,
        OrganizationSearchFilterOpportunityValidator organizationSearchFilterOpportunityValidator,
        OrganizationSearchFilterYouthValidator organizationSearchFilterYouthValidator,
        IRepositoryBatchedValueContainsWithNavigation<Opportunity.Models.Opportunity> opportunityRepository,
        IRepositoryBatchedWithNavigation<MyOpportunity.Models.MyOpportunity> myOpportunityRepository,
        IRepository<OpportunityCategory> opportunityCategoryRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _organizationService = organizationService;
      _myOpportunityActionService = myOpportunityActionService;
      _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
      _blobService = blobService;
      _organizationSearchFilterEngagementValidator = organizationSearchFilterEngagementValidator;
      _organizationSearchFilterOpportunityValidator = organizationSearchFilterOpportunityValidator;
      _organizationSearchFilterYouthValidator = organizationSearchFilterYouthValidator;
      _opportunityRepository = opportunityRepository;
      _myOpportunityRepository = myOpportunityRepository;
      _opportunityCategoryRepository = opportunityCategoryRepository;
    }
    #endregion

    #region Public Members
    public OrganizationSearchResultsEngagement SearchOrganizationEngagement(OrganizationSearchFilterEngagement filter)
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Analytics))
        return SearchOrganizationEngagementInternal(filter);

      var result = _memoryCache.GetOrCreate($"{nameof(OrganizationSearchResultsEngagement)}:{HashHelper.ComputeSHA256Hash(filter)}", entry =>
      {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(_appSettings.CacheAbsoluteExpirationRelativeToNowInHoursAnalytics);
        return SearchOrganizationEngagementInternal(filter);
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached '{nameof(OrganizationSearchResultsEngagement)}s'");
      return result;
    }

    public OrganizationSearchResultsOpportunity SearchOrganizationOpportunities(OrganizationSearchFilterOpportunity filter)
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Analytics))
        return SearchOrganizationOpportunitiesInternal(filter);

      var result = _memoryCache.GetOrCreate($"{nameof(OrganizationSearchResultsOpportunity)}:{HashHelper.ComputeSHA256Hash(filter)}", entry =>
      {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(_appSettings.CacheAbsoluteExpirationRelativeToNowInHoursAnalytics);
        return SearchOrganizationOpportunitiesInternal(filter);
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached '{nameof(OrganizationSearchResultsOpportunity)}s'");
      return result;
    }

    public OrganizationSearchResultsYouth SearchOrganizationYouth(OrganizationSearchFilterYouth filter)
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Analytics))
        return SearchOrganizationYouthInternal(filter);

      var result = _memoryCache.GetOrCreate($"{nameof(OrganizationSearchResultsYouth)}:{HashHelper.ComputeSHA256Hash(filter)}", entry =>
      {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(_appSettings.CacheAbsoluteExpirationRelativeToNowInHoursAnalytics);
        return SearchOrganizationYouthInternal(filter);
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached '{nameof(OrganizationSearchResultsYouth)}s'");
      return result;
    }
    #endregion

    #region Private Members
    private string? GetBlobObjectURL(StorageType? storageType, string? key)
    {
      if (!storageType.HasValue || string.IsNullOrEmpty(key)) return null;
      return _blobService.GetURL(storageType.Value, key);
    }

    private OrganizationSearchResultsEngagement SearchOrganizationEngagementInternal(OrganizationSearchFilterEngagement filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _organizationSearchFilterEngagementValidator.ValidateAndThrow(filter);

      _organizationService.IsAdmin(filter.Organization, true);

      var queryBase = MyOpportunityQueryBase(filter);

      //'my' opportunities: viewed
      var queryViewed = MyOpportunityQueryViewed(queryBase);

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
      itemsViewed.ForEach(o => { resultsViewed.Add(new TimeValueEntry(o.WeekEnding, o.Count, default(int))); });

      //'my' opportunities: completed
      var queryCompleted = MyOpportunityQueryCompleted(queryBase);

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
      var result = new OrganizationSearchResultsEngagement { Opportunities = new OrganizationOpportunity() };

      var viewedCount = itemsViewed.Sum(o => o.Count);
      var completedCount = itemsCompleted.Sum(o => o.Count);

      //engagement
      //'my' opportunities: viewed & completed verifications
      result.Opportunities.ViewedCompleted = new TimeIntervalSummary()
      { Legend = ["Viewed", "Completions"], Data = resultsViewedCompleted, Count = [viewedCount, completedCount] };

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

      //average conversation rate
      var items = SearchOrganizationOpportunitiesQueryBase(new OrganizationSearchFilterOpportunity
      {
        Organization = filter.Organization,
        Opportunities = filter.Opportunities,
        Categories = filter.Categories,
        StartDate = filter.StartDate,
        EndDate = filter.EndDate

      }).ToList();

      result.Opportunities.ConversionRate = new OpportunityConversionRatio
      {
        Legend = "Conversion rate (average)",
        ViewedCount = viewedCount,
        CompletedCount = completedCount,
        //calculate average percentage based on individual opportunity conversion ratio rather than global counts (more accurate)
        Percentage = items.Count != 0
              ? Math.Min(100M, Math.Round(items.Sum(o => o.ConversionRatioPercentage) / items.Count))
              : 0M
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
          .OrderBy(result => result.WeekEnding)
          .ToList();

      var resultsSkills = new List<TimeValueEntry>();
      itemSkills.ForEach(o => { resultsSkills.Add(new TimeValueEntry(o.WeekEnding, o.Count)); });
      result.Skills = new OrganizationOpportunitySkill
      {
        TopCompleted = new OpportunitySkillTopCompleted { Legend = "Most completed skills", TopCompleted = [.. flattenedSkills.Take(Skill_Count).Select(g => g.Skill).OrderBy(s => s.Name)] },
        Items = new TimeIntervalSummary()
        { Legend = ["Total unique skills",], Data = resultsSkills, Count = [flattenedSkills.Count] }
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
                  string.IsNullOrEmpty(opportunity.UserGender) || opportunity.UserGender.ToLower() == Core.Gender.PreferNotToSay.ToDescription().ToLower()
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

      result.DateStamp = DateTimeOffset.UtcNow;
      return result;
    }

    private OrganizationSearchResultsOpportunity SearchOrganizationOpportunitiesInternal(OrganizationSearchFilterOpportunity filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _organizationSearchFilterOpportunityValidator.ValidateAndThrow(filter);

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

    private IQueryable<OpportunityInfoAnalytics> SearchOrganizationOpportunitiesQueryBase(OrganizationSearchFilterOpportunity filter)
    {
      return OpportunityQueryBase(filter)
          .Select(opportunity => new
          {
            Opportunity = opportunity,
            ViewedCount = _myOpportunityRepository.Query()
              .Where(mo => mo.OpportunityId == opportunity.Id &&
                           mo.ActionId == _myOpportunityActionService.GetByName(MyOpportunity.Action.Viewed.ToString()).Id &&
                           (!filter.StartDate.HasValue || mo.OpportunityDateStart >= filter.StartDate.RemoveTime()) &&
                           (!filter.EndDate.HasValue || !mo.OpportunityDateEnd.HasValue || mo.OpportunityDateEnd <= filter.EndDate.ToEndOfDay()))
              .Count(),
            CompletedCount = _myOpportunityRepository.Query()
              .Where(mo => mo.OpportunityId == opportunity.Id &&
                           mo.ActionId == _myOpportunityActionService.GetByName(MyOpportunity.Action.Verification.ToString()).Id &&
                           mo.VerificationStatusId == _myOpportunityVerificationStatusService.GetByName(MyOpportunity.VerificationStatus.Completed.ToString()).Id &&
                           (!filter.StartDate.HasValue || mo.OpportunityDateStart >= filter.StartDate.RemoveTime()) &&
                           (!filter.EndDate.HasValue || !mo.OpportunityDateEnd.HasValue || mo.OpportunityDateEnd <= filter.EndDate.ToEndOfDay()))
              .Count()
          })
          .Select(result => new OpportunityInfoAnalytics
          {
            Id = result.Opportunity.Id,
            Title = result.Opportunity.Title,
            Status = result.Opportunity.Status,
            OrganizationLogoId = result.Opportunity.OrganizationLogoId,
            OrganizationLogoStorageType = result.Opportunity.OrganizationLogoStorageType,
            OrganizationLogoKey = result.Opportunity.OrganizationLogoKey,
            ViewedCount = result.ViewedCount,
            CompletedCount = result.CompletedCount,
            ConversionRatioPercentage = (result.ViewedCount > 0) ? Math.Min(100, Math.Round((decimal)result.CompletedCount / result.ViewedCount * 100, 2)) : 0
          });
    }

    private OrganizationSearchResultsYouth SearchOrganizationYouthInternal(OrganizationSearchFilterYouth filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _organizationSearchFilterYouthValidator.ValidateAndThrow(filter);

      var query = MyOpportunityQueryCompleted(MyOpportunityQueryBase(filter))
          .Select(o => new YouthInfo
          {
            UserId = o.UserId,
            UserDisplayName = o.UserDisplayName,
            OpportunityId = o.OpportunityId,
            OpportunityTitle = o.OpportunityTitle,
            OpportunityStatus = o.OpportunityStatus,
            OrganizationLogoId = o.OrganizationLogoId,
            OrganizationLogoStorageType = o.OrganizationLogoStorageType,
            OrganizationLogoKey = o.OrganizationLogoKey,
            DateCompleted = o.DateCompleted,
            Verified = o.OpportunityCredentialIssuanceEnabled
          });

      var result = new OrganizationSearchResultsYouth();

      query = query.OrderByDescending(o => o.DateCompleted).ThenBy(o => o.UserDisplayName).ThenBy(o => o.OpportunityTitle)
        .ThenBy(o => o.UserId).ThenBy(o => o.OpportunityId); //ensure deterministic sorting / consistent pagination results

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

    private IQueryable<MyOpportunity.Models.MyOpportunity> MyOpportunityQueryBase(IOrganizationSearchFilterBase filter)
    {
      //organization
      var result = _myOpportunityRepository.Query(true).Where(o => o.OrganizationId == filter.Organization);

      //opportunities
      if (filter.Opportunities != null && filter.Opportunities.Count != 0)
      {
        filter.Opportunities = filter.Opportunities.Distinct().ToList();
        result = result.Where(o => filter.Opportunities.Contains(o.OpportunityId));
      }

      //categories
      if (filter.Categories != null && filter.Categories.Count != 0)
      {
        filter.Categories = filter.Categories.Distinct().ToList();
        result = result.Where(opportunity => _opportunityCategoryRepository.Query().Any(
            opportunityCategory => filter.Categories.Contains(opportunityCategory.CategoryId) && opportunityCategory.OpportunityId == opportunity.OpportunityId));
      }

      //date range
      if (filter.StartDate.HasValue)
      {
        var startDate = filter.StartDate.Value.RemoveTime();
        result = result.Where(o => o.OpportunityDateStart >= startDate);
      }

      if (filter.EndDate.HasValue)
      {
        var endDate = filter.EndDate.Value.ToEndOfDay();
        result = result.Where(o => !o.OpportunityDateEnd.HasValue || o.OpportunityDateEnd.Value <= endDate);
      }

      return result;
    }

    private IQueryable<MyOpportunity.Models.MyOpportunity> MyOpportunityQueryViewed(IQueryable<MyOpportunity.Models.MyOpportunity> queryBase)
    {
      var actionId = _myOpportunityActionService.GetByName(MyOpportunity.Action.Viewed.ToString()).Id;

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

    private IQueryable<Opportunity.Models.Opportunity> OpportunityQueryBase(IOrganizationSearchFilterBase filter)
    {
      //organization
      var result = _opportunityRepository.Query(true).Where(o => o.OrganizationId == filter.Organization);

      //opportunities
      if (filter.Opportunities != null && filter.Opportunities.Count != 0)
      {
        filter.Opportunities = filter.Opportunities.Distinct().ToList();
        result = result.Where(o => filter.Opportunities.Contains(o.Id));
      }

      //categories
      if (filter.Categories != null && filter.Categories.Count != 0)
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
        result = result.Where(o => !o.DateEnd.HasValue || o.DateEnd.Value <= filter.EndDate);
      }

      return result;
    }
    #endregion
  }
}
