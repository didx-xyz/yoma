using FluentValidation;
using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Helpers;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Validators;

namespace Yoma.Core.Domain.Opportunity.Services
{
    //TODO: Background status changes
    public class OpportunityService : IOpportunityService
    {
        #region Class Variables
        private readonly IHttpContextAccessor _httpContextAccessor;

        private readonly IOpportunityStatusService _opportunityStatusService;
        private readonly IOpportunityCategoryService _opportunityCategoryService;
        private readonly ICountryService _countryService;
        private readonly IOrganizationService _organizationService;
        private readonly IOpportunityTypeService _opportunityTypeService;
        private readonly ILanguageService _languageService;
        private readonly ISkillService _skillService;
        private readonly IOpportunityDifficultyService _opportunityDifficultyService;
        private readonly ITimeIntervalService _timeIntervalService;

        private readonly OpportunityRequestValidator _opportunityRequestValidator;
        private readonly OpportunitySearchFilterInfoValidator _searchFilterInfoValidator;
        private readonly OpportunitySearchFilterValidator _searchFilterValidator;

        private readonly IRepositoryValueContainsWithNavigation<Models.Opportunity> _opportunityRepository;
        private readonly IRepository<OpportunityCategory> _opportunityCategoryRepository;
        private readonly IRepository<OpportunityCountry> _opportunityCountryRepository;
        private readonly IRepository<OpportunityLanguage> _opportunityLanguageRepository;
        private readonly IRepository<OpportunitySkill> _opportunitySkillRepository;

        public const string Keywords_Separator = ",";
        public const int Keywords_CombinedMaxLength = 500;
        private static readonly Status[] Statuses_Updatable = { Status.Active, Status.Inactive };
        private static readonly Status[] Statuses_Activatable = { Status.Inactive };
        private static readonly Status[] Statuses_CanDelete = { Status.Active, Status.Inactive };
        private static readonly Status[] Statuses_DeActivatable = { Status.Active };
        #endregion

        #region Constructor
        public OpportunityService(IHttpContextAccessor httpContextAccessor,
            IOpportunityStatusService opportunityStatusService,
            IOpportunityCategoryService opportunityCategoryService,
            ICountryService countryService,
            IOrganizationService organizationService,
            IOpportunityTypeService opportunityTypeService,
            ILanguageService languageService,
            ISkillService skillService,
            IOpportunityDifficultyService opportunityDifficultyService,
            ITimeIntervalService timeIntervalService,
            OpportunityRequestValidator opportunityRequestValidator,
            OpportunitySearchFilterInfoValidator searchFilterInfoValidator,
            OpportunitySearchFilterValidator searchFilterValidator,
            IRepositoryValueContainsWithNavigation<Models.Opportunity> opportunityRepository,
            IRepository<OpportunityCategory> opportunityCategoryRepository,
            IRepository<OpportunityCountry> opportunityCountryRepository,
            IRepository<OpportunityLanguage> opportunityLanguageRepository,
            IRepository<OpportunitySkill> opportunitySkillRepository)
        {
            _httpContextAccessor = httpContextAccessor;

            _opportunityStatusService = opportunityStatusService;
            _opportunityCategoryService = opportunityCategoryService;
            _countryService = countryService;
            _organizationService = organizationService;
            _opportunityTypeService = opportunityTypeService;
            _languageService = languageService;
            _skillService = skillService;
            _opportunityDifficultyService = opportunityDifficultyService;
            _timeIntervalService = timeIntervalService;

            _opportunityRequestValidator = opportunityRequestValidator;
            _searchFilterInfoValidator = searchFilterInfoValidator;
            _searchFilterValidator = searchFilterValidator;

            _opportunityRepository = opportunityRepository;
            _opportunityCategoryRepository = opportunityCategoryRepository;
            _opportunityCountryRepository = opportunityCountryRepository;
            _opportunityLanguageRepository = opportunityLanguageRepository;
            _opportunitySkillRepository = opportunitySkillRepository;
        }
        #endregion

        #region Public Members
        public bool Active(Guid id, bool checkStarted, bool throwNotFound)
        {
            var opportunity = throwNotFound ? GetById(id, false, false) : GetByIdOrNull(id, false);
            if (opportunity == null) return false;
            return Active(opportunity, checkStarted);
        }

        public bool Active(Models.Opportunity opportunity, bool checkStarted)
        {
            if (opportunity == null)
                throw new ArgumentNullException(nameof(opportunity));

            if (checkStarted && opportunity.DateStart > DateTimeOffset.Now) return false;

            if (!_organizationService.Active(opportunity.OrganizationId, true)) return false;

            return opportunity.Status == Status.Active;
        }

        public Models.Opportunity GetById(Guid id, bool includeChildren, bool ensureOrganizationAuthorization)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            var result = GetByIdOrNull(id, includeChildren)
                ?? throw new ArgumentOutOfRangeException(nameof(id), $"{nameof(Models.Opportunity)} with id '{id}' does not exist");

            if (ensureOrganizationAuthorization)
                _organizationService.IsAdmin(result.OrganizationId, true);

            return result;
        }

        public Models.Opportunity? GetByIdOrNull(Guid id, bool includeChildItems)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            var result = _opportunityRepository.Query(includeChildItems).SingleOrDefault(o => o.Id == id);
            if (result == null) return null;

            return result;
        }

        public OpportunityInfo GetInfoById(Guid id, bool includeChildren)
        {
            var result = GetById(id, includeChildren, false);

            return result.ToOpportunityInfo();
        }

        public Models.Opportunity? GetByTitleOrNull(string title, bool includeChildItems)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new ArgumentNullException(nameof(title));
            title = title.Trim();

            var result = _opportunityRepository.Query(includeChildItems).SingleOrDefault(o => o.Title == title);
            if (result == null) return null;

            return result;
        }

        public OpportunityInfo? GetInfoByTitleOrNull(string title, bool includeChildItems)
        {
            var result = GetByTitleOrNull(title, includeChildItems);
            if (result == null) return null;

            return result.ToOpportunityInfo();
        }

        public OpportunitySearchResultsInfo SearchInfo(OpportunitySearchFilterInfo filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            _searchFilterInfoValidator.ValidateAndThrow(filter);

            var filterInternal = new OpportunitySearchFilter
            {
                // active only
                Statuses = new List<Status> { Status.Active },
                TypeIds = filter.TypeIds,
                CategoryIds = filter.CategoryIds,
                LanguageIds = filter.LanguageIds,
                CountryIds = filter.CountryIds,
                ValueContains = filter.ValueContains,
                ValueContainsActiveMatchesOnly = true,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };

            var searchResult = Search(filterInternal, false);
            var results = new OpportunitySearchResultsInfo
            {
                TotalCount = searchResult.TotalCount,
                Items = searchResult.Items.Select(o => o.ToOpportunityInfo()).ToList()
            };

            return results;
        }

        public OpportunitySearchResults Search(OpportunitySearchFilter filter, bool ensureOrganizationAuthorization)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            _searchFilterValidator.ValidateAndThrow(filter);

            if (ensureOrganizationAuthorization)
            {
                if (filter.OrganizationIds != null) //specified; ensure authorized
                    _organizationService.IsAdminsOf(filter.OrganizationIds, true);
                else //none specified; ensure search only spans authorized organizations
                    filter.OrganizationIds = _organizationService.ListAdminsOf().Select(o => o.Id).ToList();
            }

            var query = _opportunityRepository.Query(true);

            //date range
            if (filter.StartDate.HasValue)
            {
                filter.StartDate = filter.StartDate.Value.RemoveTime();
                query = query.Where(o => o.DateCreated >= filter.StartDate.Value);
            }

            if (filter.EndDate.HasValue)
            {
                filter.EndDate = filter.EndDate.Value.ToEndOfDay();
                query = query.Where(o => o.DateCreated <= filter.EndDate.Value);
            }

            //organization (explicitly specified)
            var filterByOrganization = false;
            var organizationIds = new List<Guid>();
            if (filter.OrganizationIds != null)
            {
                filter.OrganizationIds = filter.OrganizationIds.Distinct().ToList();
                if (filter.OrganizationIds.Any())
                {
                    filterByOrganization = true;
                    organizationIds.AddRange(filter.OrganizationIds);
                }
            }

            //types (explicitly specified)
            var filterByType = false;
            var typeIds = new List<Guid>();
            if (filter.TypeIds != null)
            {
                filter.TypeIds = filter.TypeIds.Distinct().ToList();
                if (filter.TypeIds.Any())
                {
                    filterByType = true;
                    typeIds.AddRange(filter.TypeIds);
                }
            }

            //categories (explicitly specified)
            var filterByCategories = false;
            var categoryIds = new List<Guid>();
            if (filter.CategoryIds != null)
            {
                filter.CategoryIds = filter.CategoryIds.Distinct().ToList();
                if (filter.CategoryIds.Any())
                {
                    filterByCategories = true;
                    categoryIds.AddRange(filter.CategoryIds);
                }
            }

            //languages
            if (filter.LanguageIds != null)
            {
                filter.LanguageIds = filter.LanguageIds.Distinct().ToList();
                if (filter.LanguageIds.Any())
                {
                    var matchedOpportunityIds = _opportunityLanguageRepository.Query().Where(o => filter.LanguageIds.Contains(o.LanguageId)).Select(o => o.OpportunityId).ToList();
                    query = query.Where(o => matchedOpportunityIds.Contains(o.Id));
                }
            }

            //countries
            if (filter.CountryIds != null)
            {
                filter.CountryIds = filter.CountryIds.Distinct().ToList();
                if (filter.CountryIds.Any())
                {
                    var matchedOpportunityIds = _opportunityCountryRepository.Query().Where(o => filter.CountryIds.Contains(o.CountryId)).Select(o => o.OpportunityId).ToList();
                    query = query.Where(o => matchedOpportunityIds.Contains(o.Id));
                }
            }

            //statuses
            if (filter.Statuses != null)
            {
                filter.Statuses = filter.Statuses.Distinct().ToList();
                if (filter.Statuses.Any())
                {
                    var statusIds = filter.Statuses.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();
                    query = query.Where(o => statusIds.Contains(o.StatusId));
                }
            }

            //valueContains (includes organizations, types, categories, opportunities and skills)
            if (!string.IsNullOrEmpty(filter.ValueContains))
            {
                var predicate = PredicateBuilder.False<Models.Opportunity>();

                //organizations
                var matchedOrganizations = _organizationService.Contains(filter.ValueContains);
                var activeOrgsOnly = filter.ValueContainsActiveMatchesOnly.HasValue && filter.ValueContainsActiveMatchesOnly.Value;
                var matchedOrganizationIds = activeOrgsOnly
                    ? matchedOrganizations.Where(o => o.Status == Entity.OrganizationStatus.Active).Select(o => o.Id).ToList() : matchedOrganizations.Select(o => o.Id).ToList();

                if (ensureOrganizationAuthorization)
                {
                    organizationIds = organizationIds.Intersect(matchedOrganizationIds).ToList(); //organizationIds == authorized organizations; only include matched authorized organizations
                    predicate = predicate.And(o => organizationIds.Contains(o.OrganizationId));
                }
                else
                {
                    organizationIds.AddRange(matchedOrganizationIds.Except(organizationIds));
                    predicate = predicate.Or(o => organizationIds.Contains(o.OrganizationId));
                }

                //types
                var matchedTypeIds = _opportunityTypeService.Contains(filter.ValueContains).Select(o => o.Id).ToList();
                typeIds.AddRange(matchedTypeIds.Except(typeIds));
                predicate = predicate.Or(o => matchedTypeIds.Contains(o.TypeId));

                //categories
                var matchedCategoryIds = _opportunityCategoryService.Contains(filter.ValueContains).Select(o => o.Id).ToList();
                categoryIds.AddRange(matchedCategoryIds.Except(categoryIds));
                var matchedOpportunities = _opportunityCategoryRepository.Query().Where(o => categoryIds.Contains(o.CategoryId)).Select(o => o.OpportunityId).ToList();
                predicate = predicate.Or(o => matchedOpportunities.Contains(o.Id));

                //opportunities
                predicate = _opportunityRepository.Contains(predicate, filter.ValueContains);

                //skills
                var matchedSkillIds = _skillService.Contains(filter.ValueContains).Select(o => o.Id).ToList();
                matchedOpportunities = _opportunitySkillRepository.Query().Where(o => matchedSkillIds.Contains(o.SkillId)).Select(o => o.OpportunityId).ToList();
                predicate = predicate.Or(o => matchedOpportunities.Contains(o.Id));

                query = query.Where(predicate);
            }
            else
            {
                if (filterByOrganization)
                    query = query.Where(o => organizationIds.Contains(o.OrganizationId));

                if (filterByType)
                    query = query.Where(o => typeIds.Contains(o.TypeId));

                if (filterByCategories)
                {
                    var matchedOpportunities = _opportunityCategoryRepository.Query().Where(o => categoryIds.Contains(o.CategoryId)).Select(o => o.OpportunityId).ToList();
                    query = query.Where(o => matchedOpportunities.Contains(o.Id));
                }
            }

            var results = new OpportunitySearchResults();
            query = query.OrderByDescending(o => o.DateCreated);

            //pagination
            if (filter.PaginationEnabled)
            {
                results.TotalCount = query.Count();
                query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
            }

            results.Items = query.ToList();

            return results;
        }

        public async Task<Models.Opportunity> Upsert(OpportunityRequest request, bool ensureOrganizationAuthorization)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization);

            _opportunityRequestValidator.ValidateAndThrow(request);

            // check if user exists
            var isNew = !request.Id.HasValue;

            if (!isNew && ensureOrganizationAuthorization)
                _organizationService.IsAdmin(request.OrganizationId, true);

            var result = !request.Id.HasValue ? new Models.Opportunity { Id = Guid.NewGuid() } : GetById(request.Id.Value, true, false);

            var existingByTitle = GetByTitleOrNull(request.Title, false);
            if (existingByTitle != null && (isNew || result.Id != existingByTitle.Id))
                throw new ValidationException($"{nameof(Models.Opportunity)} with the specified name '{request.Title}' already exists");

            result.Title = request.Title;
            result.Description = request.Description;
            result.TypeId = request.TypeId;
            result.Type = _opportunityTypeService.GetById(request.TypeId).Name;
            result.OrganizationId = request.OrganizationId;
            result.Organization = _organizationService.GetById(request.OrganizationId, false, false).Name;
            result.Instructions = request.Instructions;
            result.URL = request.URL;
            result.ZltoReward = request.ZltoReward;
            result.YomaReward = request.YomaReward;
            result.ZltoRewardPool = request.ZltoRewardPool;
            result.YomaRewardPool = request.YomaRewardPool;
            result.VerificationSupported = request.VerificationSupported;
            result.DifficultyId = request.DifficultyId;
            result.Difficulty = _opportunityDifficultyService.GetById(request.DifficultyId).Name;
            result.CommitmentIntervalId = request.CommitmentIntervalId;
            result.CommitmentInterval = _timeIntervalService.GetById(request.CommitmentIntervalId).Name;
            result.CommitmentIntervalCount = request.CommitmentIntervalCount;
            result.ParticipantLimit = request.ParticipantLimit;
            result.Keywords = request.Keywords == null ? null : string.Join(Keywords_Separator, request.Keywords);
            result.DateStart = request.DateStart.RemoveTime();
            result.DateEnd = !request.DateEnd.HasValue ? null : request.DateEnd.Value.ToEndOfDay();

            if (isNew)
            {
                var status = request.PostAsActive ? Status.Active : Status.Inactive;
                result.StatusId = _opportunityStatusService.GetByName(status.ToString()).Id;
                result.Status = status;
                result.CreatedBy = username;
                result = await _opportunityRepository.Create(result);
            }
            else
            {
                if (!Statuses_Updatable.Contains(result.Status))
                    throw new InvalidOperationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{result.Status}')");

                result.ModifiedBy = username;
                await _opportunityRepository.Update(result);
                result.DateModified = DateTimeOffset.Now;
            }

            return result;
        }

        public async Task<(decimal? ZltoReward, decimal? YomaReward)> FinalizeVerification(Guid id, bool completed, bool ensureOrganizationAuthorization)
        {
            var opportunity = GetById(id, false, ensureOrganizationAuthorization);

            //can complete, provided active (and started) or expired; action prior to expiration
            if (!Active(opportunity, true) && opportunity.Status != Status.Expired)
                new InvalidOperationException($"{nameof(Models.Opportunity)} verification can no longer be completed (current status '{opportunity.Status}' | start date '{opportunity.DateStart}')");

            if (!completed) return (null, null);

            var count = (opportunity.ParticipantCount ?? 0) + 1;
            if (opportunity.ParticipantLimit.HasValue && count > opportunity.ParticipantLimit.Value)
                throw new InvalidOperationException($"Increment will exceed limit (current count '{opportunity.ParticipantCount ?? 0}' vs current limit '{opportunity.ParticipantLimit.Value}')");
            opportunity.ParticipantCount = count;

            var zltoReward = opportunity.ZltoReward;
            if (zltoReward.HasValue)
            {
                if (opportunity.ZltoRewardPool.HasValue)
                    zltoReward = Math.Max(opportunity.ZltoRewardPool.Value - (opportunity.ZltoRewardCumulative ?? 0 + zltoReward.Value), 0);

                opportunity.ZltoRewardCumulative ??= 0 + zltoReward;
            }

            var yomaReward = opportunity.YomaReward;
            if (yomaReward.HasValue)
            {
                if (opportunity.YomaRewardPool.HasValue)
                    yomaReward = Math.Max(opportunity.YomaRewardPool.Value - (opportunity.YomaRewardCumulative ?? 0 + yomaReward.Value), 0);

                opportunity.YomaRewardCumulative ??= 0 + yomaReward;
            }

            //modifiedBy preserved
            await _opportunityRepository.Update(opportunity);

            return (zltoReward, yomaReward);
        }

        public async Task UpdateStatus(Guid id, Status status, bool ensureOrganizationAuthorization)
        {
            var opportunity = GetById(id, false, ensureOrganizationAuthorization);

            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization);

            switch (status)
            {
                case Status.Active:
                    if (opportunity.Status == Status.Active) return;
                    if (!Statuses_Activatable.Contains(opportunity.Status))
                        throw new InvalidOperationException($"{nameof(Models.Opportunity)} can not be activated (current status '{opportunity.Status}')");
                    break;

                case Status.Inactive:
                    if (opportunity.Status == Status.Inactive) return;
                    if (!Statuses_DeActivatable.Contains(opportunity.Status))
                        throw new InvalidOperationException($"{nameof(Models.Opportunity)} can not be deactivated (current status '{opportunity.Status}')");
                    break;

                case Status.Deleted:
                    if (opportunity.Status == Status.Deleted) return;
                    if (!Statuses_CanDelete.Contains(opportunity.Status))
                        throw new InvalidOperationException($"{nameof(Models.Opportunity)} can not be deleted (current status '{opportunity.Status}')");

                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(status), $"{nameof(Status)} of '{status}' not supported. Only statuses '{Status.Inactive} and {Status.Deleted} can be explicitly set");
            }

            var statusId = _opportunityStatusService.GetByName(status.ToString()).Id;

            opportunity.StatusId = statusId;
            opportunity.Status = status;
            opportunity.ModifiedBy = username;

            await _opportunityRepository.Update(opportunity);
        }

        public async Task AssignCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization)
        {
            var opportunity = GetById(id, false, ensureOrganizationAuthorization);

            if (categoryIds == null || !categoryIds.Any())
                throw new ArgumentNullException(nameof(categoryIds));

            if (!Statuses_Updatable.Contains(opportunity.Status))
                throw new InvalidOperationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}')");

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var categoryId in categoryIds)
            {
                var category = _opportunityCategoryService.GetById(categoryId);

                var item = _opportunityCategoryRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.CategoryId == category.Id);
                if (item != null) return;

                item = new OpportunityCategory
                {
                    OpportunityId = opportunity.Id,
                    CategoryId = category.Id
                };

                await _opportunityCategoryRepository.Create(item);
            }

            scope.Complete();
        }

        public async Task DeleteCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization)
        {
            var opportunity = GetById(id, false, ensureOrganizationAuthorization);

            if (categoryIds == null || !categoryIds.Any())
                throw new ArgumentNullException(nameof(categoryIds));

            if (!Statuses_Updatable.Contains(opportunity.Status))
                throw new InvalidOperationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}')");

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var categoryId in categoryIds)
            {
                var category = _opportunityCategoryService.GetById(categoryId);

                var item = _opportunityCategoryRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.CategoryId == category.Id);
                if (item == null) return;

                await _opportunityCategoryRepository.Delete(item);
            }
        }

        public async Task AssignCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization)
        {
            var opportunity = GetById(id, false, ensureOrganizationAuthorization);

            if (countryIds == null || !countryIds.Any())
                throw new ArgumentNullException(nameof(countryIds));

            if (!Statuses_Updatable.Contains(opportunity.Status))
                throw new InvalidOperationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}')");

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var countryId in countryIds)
            {
                var country = _countryService.GetById(countryId);

                var item = _opportunityCountryRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.CountryId == country.Id);
                if (item != null) return;

                item = new OpportunityCountry
                {
                    OpportunityId = opportunity.Id,
                    CountryId = country.Id
                };

                await _opportunityCountryRepository.Create(item);
            }

            scope.Complete();
        }

        public async Task DeleteCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization)
        {
            var opportunity = GetById(id, false, ensureOrganizationAuthorization);

            if (countryIds == null || !countryIds.Any())
                throw new ArgumentNullException(nameof(countryIds));

            if (!Statuses_Updatable.Contains(opportunity.Status))
                throw new InvalidOperationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}')");

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var countryId in countryIds)
            {
                var country = _countryService.GetById(countryId);

                var item = _opportunityCountryRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.CountryId == country.Id);
                if (item == null) return;

                await _opportunityCountryRepository.Delete(item);
            }
        }

        public async Task AssignLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization)
        {
            var opportunity = GetById(id, false, ensureOrganizationAuthorization);

            if (languageIds == null || !languageIds.Any())
                throw new ArgumentNullException(nameof(languageIds));

            if (!Statuses_Updatable.Contains(opportunity.Status))
                throw new InvalidOperationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}')");

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var languageId in languageIds)
            {
                var language = _languageService.GetById(languageId);

                var item = _opportunityLanguageRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.LanguageId == language.Id);
                if (item != null) return;

                item = new OpportunityLanguage
                {
                    OpportunityId = opportunity.Id,
                    LanguageId = language.Id
                };

                await _opportunityLanguageRepository.Create(item);
            }

            scope.Complete();
        }

        public async Task DeleteLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization)
        {
            var opportunity = GetById(id, false, ensureOrganizationAuthorization);

            if (languageIds == null || !languageIds.Any())
                throw new ArgumentNullException(nameof(languageIds));

            if (!Statuses_Updatable.Contains(opportunity.Status))
                throw new InvalidOperationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}')");

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var languageId in languageIds)
            {
                var language = _languageService.GetById(languageId);

                var item = _opportunityLanguageRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.LanguageId == language.Id);
                if (item == null) return;

                await _opportunityLanguageRepository.Delete(item);
            }
        }

        public async Task AssignSkills(Guid id, List<Guid> skillIds, bool ensureOrganizationAuthorization)
        {
            var opportunity = GetById(id, false, ensureOrganizationAuthorization);

            if (skillIds == null || !skillIds.Any())
                throw new ArgumentNullException(nameof(skillIds));

            if (!Statuses_Updatable.Contains(opportunity.Status))
                throw new InvalidOperationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}')");

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var skillId in skillIds)
            {
                var skill = _skillService.GetById(skillId);

                var item = _opportunitySkillRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.SkillId == skill.Id);
                if (item != null) return;

                item = new OpportunitySkill
                {
                    OpportunityId = opportunity.Id,
                    SkillId = skill.Id
                };

                await _opportunitySkillRepository.Create(item);
            }

            scope.Complete();
        }

        public async Task DeleteSkills(Guid id, List<Guid> skillIds, bool ensureOrganizationAuthorization)
        {
            var opportunity = GetById(id, false, ensureOrganizationAuthorization);

            if (skillIds == null || !skillIds.Any())
                throw new ArgumentNullException(nameof(skillIds));

            if (!Statuses_Updatable.Contains(opportunity.Status))
                throw new InvalidOperationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}')");

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var skillId in skillIds)
            {
                var skill = _skillService.GetById(skillId);

                var item = _opportunitySkillRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.SkillId == skill.Id);
                if (item == null) return;

                await _opportunitySkillRepository.Delete(item);
            }
        }
        #endregion
    }
}
