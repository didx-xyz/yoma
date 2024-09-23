using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces.Lookups;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.Marketplace.Validators;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces;

namespace Yoma.Core.Domain.Marketplace.Services
{
  public class StoreAccessControlRuleService : IStoreAccessControlRuleService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IStoreAccessControlRuleStatusService _storeAccessControlRuleStatusService;
    private readonly IOrganizationService _organizationService;
    private readonly ICountryService _countryService;
    private readonly IGenderService _genderService;
    private readonly IOpportunityService _opportunityService;
    private readonly IUserService _userService;
    private readonly IMyOpportunityActionService _myOpportunityActionService;
    private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
    private readonly StoreAccessControlRuleSearchFilterValidator _storeAccessControlRuleSearchFilterValidator;
    private readonly StoreAccessControlRuleRequestValidatorCreate _storeAccessControlRuleRequestValidatorCreate;
    private readonly StoreAccessControlRuleRequestValidatorUpdate _storeAccessControlRuleRequestValidatorUpdate;
    private readonly IRepositoryBatchedValueContainsWithNavigation<StoreAccessControlRule> _storeAccessControlRuleRepistory;
    private readonly IRepository<StoreAccessControlRuleOpportunity> _storeAccessControlRuleOpportunityRepository;
    private readonly IRepositoryValueContainsWithNavigation<User> _userRepository;
    private readonly IRepositoryBatchedWithNavigation<MyOpportunity.Models.MyOpportunity> _myOpportunityRepository;
    private readonly IExecutionStrategyService _executionStrategyService;

    private static readonly StoreAccessControlRuleStatus[] Statuses_Updatable = [StoreAccessControlRuleStatus.Active, StoreAccessControlRuleStatus.Inactive];
    private static readonly StoreAccessControlRuleStatus[] Statuses_Activatable = [StoreAccessControlRuleStatus.Inactive];
    private static readonly StoreAccessControlRuleStatus[] Statuses_CanDelete = [StoreAccessControlRuleStatus.Active, StoreAccessControlRuleStatus.Inactive];
    private static readonly StoreAccessControlRuleStatus[] Statuses_DeActivatable = [StoreAccessControlRuleStatus.Active];
    #endregion

    #region Constructor
    public StoreAccessControlRuleService(IOptions<AppSettings> appSettings,
      IMemoryCache memoryCache,
      IHttpContextAccessor httpContextAccessor,
      IStoreAccessControlRuleStatusService storeAccessControlRuleStatusService,
      IOrganizationService organizationService,
      ICountryService countryService,
      IGenderService genderService,
      IOpportunityService opportunityService,
      IUserService userService,
      IMyOpportunityActionService myOpportunityActionService,
      IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
      StoreAccessControlRuleSearchFilterValidator storeAccessControlRuleSearchFilterValidator,
      StoreAccessControlRuleRequestValidatorCreate storeAccessControlRuleRequestValidatorCreate,
      StoreAccessControlRuleRequestValidatorUpdate storeAccessControlRuleRequestValidatorUpdate,
      IRepositoryBatchedValueContainsWithNavigation<StoreAccessControlRule> storeAccessControlRuleRepistory,
      IRepository<StoreAccessControlRuleOpportunity> storeAccessControlRuleOpportunityRepository,
      IRepositoryValueContainsWithNavigation<User> userRepository,
      IRepositoryBatchedWithNavigation<MyOpportunity.Models.MyOpportunity> myOpportunityRepository,
      IExecutionStrategyService executionStrategyService)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _httpContextAccessor = httpContextAccessor;
      _storeAccessControlRuleStatusService = storeAccessControlRuleStatusService;
      _organizationService = organizationService;
      _countryService = countryService;
      _genderService = genderService;
      _opportunityService = opportunityService;
      _userService = userService;
      _myOpportunityActionService = myOpportunityActionService;
      _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
      _storeAccessControlRuleSearchFilterValidator = storeAccessControlRuleSearchFilterValidator;
      _storeAccessControlRuleRequestValidatorCreate = storeAccessControlRuleRequestValidatorCreate;
      _storeAccessControlRuleRequestValidatorUpdate = storeAccessControlRuleRequestValidatorUpdate;
      _storeAccessControlRuleRepistory = storeAccessControlRuleRepistory;
      _storeAccessControlRuleOpportunityRepository = storeAccessControlRuleOpportunityRepository;
      _userRepository = userRepository;
      _myOpportunityRepository = myOpportunityRepository;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public StoreAccessControlRule GetById(Guid id, bool includeChildItems)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = GetByIdOrNull(id, includeChildItems)
          ?? throw new EntityNotFoundException($"{nameof(StoreAccessControlRule)} with id '{id}' does not exist");

      return result;
    }

    public StoreAccessControlRule? GetByIdOrNull(Guid id, bool includeChildItems)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _storeAccessControlRuleRepistory.Query(includeChildItems).SingleOrDefault(o => o.Id == id);
      if (result == null) return null;

      return result;
    }

    public List<OrganizationInfo> ListSearchCriteriaOrganizations()
    {
      var query = _storeAccessControlRuleRepistory.Query(false);

      var organizationIds = query.Select(o => o.OrganizationId).Distinct().ToList();

      var filter = new OrganizationSearchFilter
      {
        Organizations = organizationIds,
        InternalUse = true
      };

      var organizations = _organizationService.Search(filter, false).Items;

      return [.. organizations.OrderBy(o => o.Name)];
    }

    public List<StoreInfo> ListSearchCriteriaStores(Guid? organizationId, bool ensureOrganizationAuthorization)
    {
      var query = _storeAccessControlRuleRepistory.Query(false);

      if (!organizationId.HasValue)
      {
        if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
          throw new ValidationException($"Organization required for '{Constants.Role_OrganizationAdmin}' role only");
      }
      else
      {
        if (organizationId == Guid.Empty)
          throw new ArgumentNullException(nameof(organizationId));

        _organizationService.IsAdmin(organizationId.Value, ensureOrganizationAuthorization);

        query = query.Where(o => o.OrganizationId == organizationId.Value);
      }

      var storeRules = query
        .GroupBy(o => o.StoreId)
        .Select(g => new
        {
          Id = g.Key,
          CountryId = g.First().StoreCountryId,
          CountryName = g.First().StoreCountryName,
          CountryCodeAlpha2 = g.First().StoreCountryCodeAlpha2
        }).ToList();

      //store parsed and name populated by info service
      return storeRules
        .Select(s => new StoreInfo
        {
          Id = s.Id,
          CountryId = s.CountryId,
          CountryName = s.CountryName,
          CountryCodeAlpha2 = s.CountryCodeAlpha2
        })
        .ToList();
    }

    public StoreAccessControlRuleSearchResults Search(StoreAccessControlRuleSearchFilter filter, bool ensureOrganizationAuthorization)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _storeAccessControlRuleSearchFilterValidator.ValidateAndThrow(filter);

      var query = _storeAccessControlRuleRepistory.Query(true);

      //nameContains
      if (!string.IsNullOrEmpty(filter.NameContains))
        query = _storeAccessControlRuleRepistory.Contains(query, filter.NameContains);

      //stores
      if (filter.Stores != null && filter.Stores.Count != 0)
      {
        filter.Stores = filter.Stores.Distinct().ToList();
        query = query.Where(rule => filter.Stores.Contains(rule.StoreId));
      }

      //organizations
      if (ensureOrganizationAuthorization && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
      {
        if (filter.Organizations != null && filter.Organizations.Count != 0)
        {
          filter.Organizations = filter.Organizations.Distinct().ToList();
          _organizationService.IsAdminsOf(filter.Organizations, true);
        }
        else
          filter.Organizations = _organizationService.ListAdminsOf(false).Select(o => o.Id).ToList();
      }

      if (filter.Organizations != null && filter.Organizations.Count != 0)
        query = query.Where(o => filter.Organizations.Contains(o.OrganizationId));

      //statuses
      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        filter.Statuses = filter.Statuses.Distinct().ToList();
        var statusIds = filter.Statuses.Select(o => _storeAccessControlRuleStatusService.GetByName(o.ToString()).Id).ToList();
        query = query.Where(o => statusIds.Contains(o.StatusId));
      }

      if (!filter.NonPaginatedQuery)
        query = query.OrderBy(o => o.Name).ThenBy(o => o.Id);

      var result = new StoreAccessControlRuleSearchResults();

      //pagination
      if (filter.PaginationEnabled)
      {
        result.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      result.Items = [.. query];
      return result;
    }

    public StoreAccessControlRulePreview CreatePreview(StoreAccessControlRuleRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (!request.RequestValidationHandled) _storeAccessControlRuleRequestValidatorCreate.ValidateAndThrow(request);

      var organization = _organizationService.GetById(request.OrganizationId, false, false, false);
      var country = _countryService.GetByCodeAplha2(request.StoreCountryCodeAlpha2);

      ValidateRuleOrganizationAndName(request, organization, null);
      ValidateRuleDuplicatesAcrossOrganizations(request, null);
      ValidateRuleOpportunities(country.Id, organization, request.Opportunities);

      var (userCount, userIds) = PreviewRuleMatchedUserCount(request.AgeFrom, request.AgeTo, request.GenderId, request.Opportunities, request.OpportunityOption);

      var (relatedRules, relatedUserIds) = PreviewRelatedRules(request.StoreId, null);

      var totalUniqueUserIds = userIds.Union(relatedUserIds).Distinct().ToList();

      var result = new StoreAccessControlRulePreview
      {
        UserCount = userCount,
        RulesRelated = relatedRules,
        UserCountTotal = totalUniqueUserIds.Count
      };

      return result;
    }

    public async Task<StoreAccessControlRule> Create(StoreAccessControlRuleRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (!request.RequestValidationHandled) await _storeAccessControlRuleRequestValidatorCreate.ValidateAndThrowAsync(request);

      var organization = _organizationService.GetById(request.OrganizationId, false, false, false);
      var country = _countryService.GetByCodeAplha2(request.StoreCountryCodeAlpha2);
      var gender = request.GenderId.HasValue ? _genderService.GetById(request.GenderId.Value) : null;
      var status = request.PostAsActive ? StoreAccessControlRuleStatus.Active : StoreAccessControlRuleStatus.Inactive;

      var result = new StoreAccessControlRule
      {
        Name = request.Name,
        Description = request.Description,
        OrganizationId = organization.Id,
        OrganizationName = organization.Name,
        StoreCountryId = country.Id,
        StoreCountryName = country.Name,
        StoreCountryCodeAlpha2 = country.CodeAlpha2,
        StoreId = request.StoreId,
        StoreItemCategoriesRaw = request.StoreItemCategories == null ? null : JsonConvert.SerializeObject(request.StoreItemCategories),
        StoreItemCategories = request.StoreItemCategories,
        AgeFrom = request.AgeFrom,
        AgeTo = request.AgeTo,
        GenderId = gender?.Id,
        Gender = gender?.Name,
        OpportunityOption = request.OpportunityOption,
        StatusId = _storeAccessControlRuleStatusService.GetByName(status.ToString()).Id,
        Status = StoreAccessControlRuleStatus.Active,
      };

      ValidateRuleOrganizationAndName(request, organization, null);
      ValidateRuleDuplicatesAcrossOrganizations(request, null);
      var opportunitiesValidated = ValidateRuleOpportunities(result.StoreCountryId, organization, request.Opportunities);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        result = await _storeAccessControlRuleRepistory.Create(result);

        await AssignOpportunities(opportunitiesValidated, result);

        scope.Complete();
      });

      _memoryCache.Remove(CacheHelper.GenerateKey<StoreAccessControlRule>());

      return result;
    }

    public StoreAccessControlRulePreview UpdatePreview(StoreAccessControlRuleRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (!request.RequestValidationHandled) _storeAccessControlRuleRequestValidatorUpdate.ValidateAndThrow(request);

      var ruleExisting = GetById(request.Id, true);
      var organization = _organizationService.GetById(request.OrganizationId, false, false, false);
      var country = _countryService.GetByCodeAplha2(request.StoreCountryCodeAlpha2);

      ValidateRuleOrganizationAndName(request, organization, ruleExisting.Id);
      ValidateRuleDuplicatesAcrossOrganizations(request, ruleExisting.Id);
      ValidateRuleOpportunities(country.Id, organization, request.Opportunities);

      var (userCount, userIds) = PreviewRuleMatchedUserCount(request.AgeFrom, request.AgeTo, request.GenderId, request.Opportunities, request.OpportunityOption);

      var (relatedRules, relatedUserIds) = PreviewRelatedRules(request.StoreId, ruleExisting.Id);

      var totalUniqueUserIds = userIds.Union(relatedUserIds).Distinct().ToList();

      var result = new StoreAccessControlRulePreview
      {
        UserCount = userCount,
        RulesRelated = relatedRules,
        UserCountTotal = totalUniqueUserIds.Count
      };

      return result;
    }

    public async Task<StoreAccessControlRule> Update(StoreAccessControlRuleRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (!request.RequestValidationHandled) await _storeAccessControlRuleRequestValidatorUpdate.ValidateAndThrowAsync(request);

      var result = GetById(request.Id, true);
      var organization = _organizationService.GetById(request.OrganizationId, false, false, false);
      var country = _countryService.GetByCodeAplha2(request.StoreCountryCodeAlpha2);
      var gender = request.GenderId.HasValue ? _genderService.GetById(request.GenderId.Value) : null;

      result.Name = request.Name;
      result.Description = request.Description;
      result.OrganizationId = organization.Id;
      result.OrganizationName = organization.Name;
      result.StoreCountryId = country.Id;
      result.StoreCountryName = country.Name;
      result.StoreCountryCodeAlpha2 = country.CodeAlpha2;
      result.StoreId = request.StoreId;
      result.StoreItemCategoriesRaw = request.StoreItemCategories == null ? null : JsonConvert.SerializeObject(request.StoreItemCategories);
      result.StoreItemCategories = request.StoreItemCategories;
      result.AgeFrom = request.AgeFrom;
      result.AgeTo = request.AgeTo;
      result.GenderId = gender?.Id;
      result.Gender = gender?.Name;
      result.OpportunityOption = request.OpportunityOption;

      var opportunityIdsToRemove = result.Opportunities?.Where(o => request.Opportunities == null || !request.Opportunities.Contains(o.Id)).ToList();
      var opportunityIdsToAdd = request.Opportunities?.Where(o => result.Opportunities == null || !result.Opportunities.Any(i => i.Id == o)).ToList();

      ValidateRuleOrganizationAndName(request, organization, result.Id);
      ValidateRuleDuplicatesAcrossOrganizations(request, result.Id);
      var opportunitiesValidated = ValidateRuleOpportunities(result.StoreCountryId, organization, request.Opportunities);
      var opportunitiesToAdd = opportunitiesValidated?.Where(o => opportunityIdsToAdd == null || opportunityIdsToAdd.Contains(o.Id)).ToList();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        result = await _storeAccessControlRuleRepistory.Update(result);

        if (opportunityIdsToRemove != null && opportunityIdsToRemove.Count > 0)
          foreach (var opportunity in opportunityIdsToRemove)
          {
            var item = _storeAccessControlRuleOpportunityRepository.Query().SingleOrDefault(o => o.StoreAccessControlRuleId == result.Id && o.OpportunityId == opportunity.Id);
            if (item == null) continue;

            await _storeAccessControlRuleOpportunityRepository.Delete(item);

            result.Opportunities?.Remove(opportunity);
          }

        await AssignOpportunities(opportunitiesToAdd, result);

        scope.Complete();
      });

      if (result.Opportunities?.Count == 0) result.Opportunities = null;

      _memoryCache.Remove(CacheHelper.GenerateKey<StoreAccessControlRule>());

      return result;
    }

    public async Task<StoreAccessControlRule> UpdateStatus(Guid id, StoreAccessControlRuleStatus status)
    {
      var result = GetById(id, true);

      switch (status)
      {
        case StoreAccessControlRuleStatus.Active:
          if (result.Status == StoreAccessControlRuleStatus.Active) return result;
          if (!Statuses_Activatable.Contains(result.Status))
            throw new ValidationException($"{nameof(StoreAccessControlRule)} can not be activated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Activatable)}'");
          break;

        case StoreAccessControlRuleStatus.Inactive:
          if (result.Status == StoreAccessControlRuleStatus.Inactive) return result;
          if (!Statuses_DeActivatable.Contains(result.Status))
            throw new ValidationException($"{nameof(StoreAccessControlRule)} can not be deactivated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_DeActivatable)}'");
          break;

        case StoreAccessControlRuleStatus.Deleted:
          if (result.Status == StoreAccessControlRuleStatus.Deleted) return result;
          if (!Statuses_CanDelete.Contains(result.Status))
            throw new ValidationException($"{nameof(StoreAccessControlRule)} can not be deleted (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_CanDelete)}'");
          break;

        default:
          throw new ArgumentOutOfRangeException(nameof(status), $"{nameof(Status)} of '{status}' not supported");
      }

      var statusId = _storeAccessControlRuleStatusService.GetByName(status.ToString()).Id;
      result.StatusId = statusId;
      result.Status = status;

      result = await _storeAccessControlRuleRepistory.Update(result);

      _memoryCache.Remove(CacheHelper.GenerateKey<StoreAccessControlRule>());

      return result;
    }

    public StoreAccessControlRuleEvaluationResult EvaluateStoreAccessControlRules(StoreItemCategory storeItemCategory, User? user, List<MyOpportunityInfo>? myOpportunitiesCompleted)
    {
      // Evaluate access control rules at the item category level.
      // The logic follows a most restrictive approach:
      // - Rules are evaluated using OR logic, meaning if any rule grants access, the user can access that item category.
      // - However, each item category may have its own set of rules, and specific rules can override general ones.
      // - If a more restrictive rule exists for a specific item category, it will take precedence, even if a general rule grants access at the store level.
      // Example: 
      // - Rule A grants males access to the Airtime Yoma SA store.
      // - Rule B restricts access to the R10 Airtime item category to females.
      // - In this case, males can access the store except for the R10 Airtime category, where Rule B takes precedence.
      // - This ensures that the most restrictive rule determines access at the item category level.

      ArgumentNullException.ThrowIfNull(storeItemCategory, nameof(storeItemCategory));

      var rules = RulesUpdatableCached().Where(o => o.Status == StoreAccessControlRuleStatus.Active).ToList();

      var result = new StoreAccessControlRuleEvaluationResult { Locked = false };
      var matchingRules = rules.Where(o => o.StoreId == storeItemCategory.StoreId && (o.StoreItemCategories == null || o.StoreItemCategories.Contains(storeItemCategory.Id))).ToList();

      //no matching rules, resulting in unlcoked status
      if (matchingRules.Count == 0) return result;

      result.Rules = [];

      foreach (var rule in matchingRules)
      {
        var evaluationItem = new StoreAccessControlRuleEvaluationItem { Id = rule.Id, Name = rule.Name, Reasons = [] };
        var storeLocked = false;

        // evaluate age condition
        if (rule.AgeFrom.HasValue || rule.AgeTo.HasValue)
        {
          var ageMessage = string.Empty;
          var conditionPassed = true;
          var userAge = user?.DateOfBirth.HasValue == true ? (int?)user.DateOfBirth.Value.CalculateAge(null) : null;

          if (rule.AgeFrom.HasValue && rule.AgeTo.HasValue)
            ageMessage = $"Age must be between {rule.AgeFrom.Value} and {rule.AgeTo.Value}";
          else if (rule.AgeFrom.HasValue)
            ageMessage = $"Age must be greater than or equal to {rule.AgeFrom.Value}";
          else if (rule.AgeTo.HasValue)
            ageMessage = $"Age must be less than or equal to {rule.AgeTo.Value}";

          if (!userAge.HasValue || (rule.AgeFrom.HasValue && userAge < rule.AgeFrom.Value) || (rule.AgeTo.HasValue && userAge > rule.AgeTo.Value))
          {
            conditionPassed = false;
            storeLocked = true; // lock the store if users' age is not available or the condition is not met
          }

          evaluationItem.Reasons.Add(new StoreAccessControlRuleEvaluationItemReason
          {
            ConditionPassed = conditionPassed,
            Reason = ageMessage
          });
        }

        // evaluate gender condition
        if (rule.GenderId.HasValue)
        {
          var genderMessage = $"{rule.Gender} users only";
          var conditionPassed = user?.GenderId.HasValue == true && user.GenderId.Value == rule.GenderId.Value;

          if (!conditionPassed)
            storeLocked = true; // lock the store if the users' gender is not available or condition is not met

          evaluationItem.Reasons.Add(new StoreAccessControlRuleEvaluationItemReason
          {
            ConditionPassed = conditionPassed,
            Reason = genderMessage
          });
        }

        // evaluate opportunity condition
        if (rule.Opportunities != null && rule.Opportunities.Count > 0)
        {
          var opportunityMessage = rule.OpportunityOption == StoreAccessControlRuleOpportunityCondition.All
              ? "Must complete the following opportunities:"
              : "Must complete at least one of the following opportunities:";

          var opportunityLinks = rule.Opportunities.Select(o => new StoreAccessControlRuleEvaluationItemReasonLink
          {
            Title = o.Title.RemoveSpecialCharacters(),
            URL = o.YomaInfoURL(_appSettings.AppBaseURL),
            RequirementMet = myOpportunitiesCompleted?.Any(i => i.OpportunityId == o.Id) == true // check if user completed the opportunity
          }).ToList();

          if (rule.OpportunityOption == null)
            throw new InvalidOperationException($"Opportunity option expected for rule '{rule.Name}'");

          var conditionPassed = rule.OpportunityOption.Value switch
          {
            StoreAccessControlRuleOpportunityCondition.All => rule.Opportunities.All(o => myOpportunitiesCompleted?.Any(i => i.OpportunityId == o.Id) == true),
            StoreAccessControlRuleOpportunityCondition.Any => rule.Opportunities.Any(o => myOpportunitiesCompleted?.Any(i => i.OpportunityId == o.Id) == true),
            _ => throw new InvalidOperationException($"Opportunity option '{rule.OpportunityOption}' not supported")
          };

          if (!conditionPassed)
            storeLocked = true; // lock the store if the user has no completed opportunities or the condition is not met

          evaluationItem.Reasons.Add(new StoreAccessControlRuleEvaluationItemReason
          {
            ConditionPassed = conditionPassed,
            Reason = opportunityMessage,
            Links = opportunityLinks // attach the links with individual ConditionPassed flags
          });
        }

        // if any condition in this rule is not met, lock the store
        if (storeLocked)
          result.Locked = true;

        result.Rules.Add(evaluationItem);
      }

      result.Rules = [.. result.Rules.OrderBy(o => o.Name)];

      return result;
    }
    #endregion

    #region Private Members
    private (List<StoreAccessControlRulePreviewItem> Items, List<Guid> RelatedUserIds) PreviewRelatedRules(string storeId, Guid? existingRuleId)
    {
      var searchFilter = new StoreAccessControlRuleSearchFilter
      {
        Stores = [storeId],
        Statuses = [StoreAccessControlRuleStatus.Active],
        NonPaginatedQuery = true
      };

      var searchResults = Search(searchFilter, false);

      var searchResultsItems = searchResults.Items.Where(o => existingRuleId == null || o.Id != existingRuleId).ToList();

      var relatedItems = new List<StoreAccessControlRulePreviewItem>();
      var relatedUserIds = new List<Guid>();

      foreach (var rule in searchResultsItems)
      {
        var (userCount, userIds) = PreviewRuleMatchedUserCount(
            rule.AgeFrom,
            rule.AgeTo,
            rule.GenderId,
            rule.Opportunities?.Select(op => op.Id).ToList(),
            rule.OpportunityOption
        );

        relatedItems.Add(new StoreAccessControlRulePreviewItem
        {
          UserCount = userCount,
          Rule = rule
        });

        relatedUserIds.AddRange(userIds);
      }

      return (relatedItems, relatedUserIds.Distinct().ToList());
    }

    private (int UserCount, List<Guid> UserIds) PreviewRuleMatchedUserCount(int? ageFrom, int? ageTo, Guid? gender, List<Guid>? opportunities, StoreAccessControlRuleOpportunityCondition? opportunityCondition)
    {
      var currentDate = DateTimeOffset.UtcNow;

      var query = _userRepository.Query(false)
          .Select(user => new
          {
            user,
            Age = user.DateOfBirth.HasValue
                    ? (int?)(currentDate.Year - user.DateOfBirth.Value.Year -
                        ((currentDate.Month < user.DateOfBirth.Value.Month) ||
                        (currentDate.Month == user.DateOfBirth.Value.Month && currentDate.Day < user.DateOfBirth.Value.Day) ? 1 : 0))
                    : null
          });

      if (ageFrom.HasValue || ageTo.HasValue)
        query = query.Where(u => u.Age.HasValue &&
            (!ageFrom.HasValue || u.Age >= ageFrom.Value) &&
            (!ageTo.HasValue || u.Age <= ageTo.Value));

      if (gender.HasValue)
        query = query.Where(u => u.user.GenderId.HasValue && u.user.GenderId.Value == gender.Value);

      if (opportunities != null && opportunities.Count != 0)
      {
        var actionId = _myOpportunityActionService.GetByName(MyOpportunity.Action.Verification.ToString()).Id;
        var verificationStatusId = _myOpportunityVerificationStatusService.GetByName(MyOpportunity.VerificationStatus.Completed.ToString()).Id;

        var opportunityQuery = _myOpportunityRepository.Query()
            .Where(myOp =>
                myOp.ActionId == actionId &&
                myOp.VerificationStatusId == verificationStatusId &&
                opportunities.Contains(myOp.OpportunityId));

        query = opportunityCondition switch
        {
          StoreAccessControlRuleOpportunityCondition.All => query.Where(u =>
                          opportunityQuery.Count(myOp => myOp.UserId == u.user.Id) == opportunities.Count),
          StoreAccessControlRuleOpportunityCondition.Any => query.Where(u =>
                          opportunityQuery.Any(myOp => myOp.UserId == u.user.Id)),
          _ => throw new InvalidOperationException($"Opportunity option '{opportunityCondition}' not supported"),
        };
      }

      var userIds = query.Select(u => u.user.Id).Distinct().ToList();
      return (userIds.Count, userIds);
    }

    private void ValidateRuleOrganizationAndName(StoreAccessControlRuleRequestBase request, Organization organization, Guid? existingRuleId)
    {
      if (organization.Status != Entity.OrganizationStatus.Active)
        throw new ValidationException("The selected organization is inactive.");

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      var existingRuleByName = _storeAccessControlRuleRepistory.Query()
          .Where(o => o.OrganizationId == organization.Id && o.Name.ToLower() == request.Name.ToLower())
          .SingleOrDefault();
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons

      if (existingRuleByName != null && (existingRuleId == null || existingRuleByName.Id != existingRuleId))
        throw new ValidationException($"A store access control rule with the name '{request.Name}' already exists for the selected organization.");
    }

    private void ValidateRuleDuplicatesAcrossOrganizations(StoreAccessControlRuleRequestBase request, Guid? existingRuleId)
    {
      // retrieve active rules excluding the one being updated, if applicable
      var existingRules = RulesUpdatableCached()
          .Where(o => o.Status != StoreAccessControlRuleStatus.Deleted && (!existingRuleId.HasValue || o.Id != existingRuleId.Value))
          .ToList();

      // check for direct match across all organizations
      var duplicateRule = existingRules
          .FirstOrDefault(o => o.StoreId == request.StoreId
                    && (o.StoreItemCategories ?? []).SequenceEqual(request.StoreItemCategories ?? [])
                    && o.AgeFrom == request.AgeFrom
                    && o.AgeTo == request.AgeTo
                    && o.GenderId == request.GenderId
                    && ((o.Opportunities == null && request.Opportunities == null)
                        || (o.Opportunities != null && request.Opportunities != null
                            && o.Opportunities.Select(o => o.Id).OrderBy(x => x)
                                .SequenceEqual(request.Opportunities.OrderBy(x => x))))
                    && o.OpportunityOption == request.OpportunityOption);

      if (duplicateRule != null)
      {
        var reasons = new List<string>();

        // age condition
        if (duplicateRule.AgeFrom.HasValue || duplicateRule.AgeTo.HasValue)
        {
          if (duplicateRule.AgeFrom.HasValue && duplicateRule.AgeTo.HasValue)
            reasons.Add($"Age must be between {duplicateRule.AgeFrom.Value} and {duplicateRule.AgeTo.Value}.");
          else if (duplicateRule.AgeFrom.HasValue)
            reasons.Add($"Age must be greater than or equal to {duplicateRule.AgeFrom.Value}.");
          else if (duplicateRule.AgeTo.HasValue)
            reasons.Add($"Age must be less than or equal to {duplicateRule.AgeTo.Value}.");
        }

        // gender condition
        if (duplicateRule.GenderId.HasValue)
        {
          var genderMessage = $"{duplicateRule.Gender} users only.";
          reasons.Add(genderMessage);
        }

        // opportunity condition
        if (duplicateRule.Opportunities != null && duplicateRule.Opportunities.Count > 0)
        {
          var opportunityMessage = duplicateRule.OpportunityOption == StoreAccessControlRuleOpportunityCondition.All
              ? "Must complete the following opportunities:" : "Must complete at least one of the following opportunities:";

          var opportunityTitles = string.Join(", ", duplicateRule.Opportunities.Select(o => o.Title));
          reasons.Add($"{opportunityMessage} {opportunityTitles}.");
        }

        var message = $"Will result in a duplicate rule spanning all organizations. Conditions: {string.Join(" ", reasons)}";
        throw new ValidationException(message);
      }
    }

    private List<Opportunity.Models.Opportunity>? ValidateRuleOpportunities(Guid storeCountryId, Organization organization, List<Guid>? opportunities)
    {
      if (opportunities == null || opportunities.Count == 0) return null;

      var validatedOpportunities = new List<Opportunity.Models.Opportunity>();

      foreach (var opportunityId in opportunities)
      {
        var opportunity = _opportunityService.GetById(opportunityId, true, true, false);

        if (opportunity.OrganizationId != organization.Id)
          throw new ValidationException($"Opportunity '{opportunity.Title}' does not belong to the specified organization");

        if (!opportunity.Published)
          throw new ValidationException($"Opportunity '{opportunity.Title}' is not published");

        if (!opportunity.VerificationEnabled)
          throw new ValidationException($"Opportunity '{opportunity.Title}' does not have verification enabled");

        if (opportunity.Countries != null && !opportunity.Countries.Any(o => o.Id == storeCountryId))
          throw new ValidationException($"Opportunity '{opportunity.Title}' is not available in the selected store country");

        validatedOpportunities.Add(opportunity);
      }

      return validatedOpportunities;
    }


    private async Task AssignOpportunities(List<Opportunity.Models.Opportunity>? opportunities, StoreAccessControlRule result)
    {
      if (opportunities == null || opportunities.Count == 0) return;

      result.Opportunities ??= [];

      foreach (var opportunity in opportunities)
      {
        var item = _storeAccessControlRuleOpportunityRepository
            .Query()
            .SingleOrDefault(o => o.StoreAccessControlRuleId == result.Id && o.OpportunityId == opportunity.Id);

        if (item != null) continue;

        item = new StoreAccessControlRuleOpportunity
        {
          StoreAccessControlRuleId = result.Id,
          OpportunityId = opportunity.Id
        };

        await _storeAccessControlRuleOpportunityRepository.Create(item);

        result.Opportunities.Add(opportunity.ToOpportunityItem());
      }
    }

    #endregion

    #region Private Members
    private List<StoreAccessControlRule> RulesUpdatableCached()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return Search(new StoreAccessControlRuleSearchFilter { NonPaginatedQuery = true, Statuses = [.. Statuses_Updatable] }, false).Items;

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<StoreAccessControlRule>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return Search(new StoreAccessControlRuleSearchFilter { NonPaginatedQuery = true, Statuses = [.. Statuses_Updatable] }, false).Items;
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(StoreAccessControlRule)}s'");

      return result;
    }
    #endregion
  }
}
