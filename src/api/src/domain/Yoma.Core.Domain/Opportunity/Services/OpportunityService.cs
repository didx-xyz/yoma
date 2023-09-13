using FluentValidation;
using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Helpers;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Validators;

namespace Yoma.Core.Domain.Opportunity.Services
{
    public class OpportunityService : IOpportunityService
    {
        #region Class Variables
        private readonly IHttpContextAccessor _httpContextAccessor;

        private readonly IOpportunityStatusService _opportunityStatusService;
        private readonly IOpportunityCategoryService _opportunityCategoryService;
        private readonly ICountryService _countryService;
        private readonly IOrganizationService _organizationService;
        private readonly IOrganizationStatusService _organizationStatusService;
        private readonly IOpportunityTypeService _opportunityTypeService;
        private readonly ILanguageService _languageService;
        private readonly ISkillService _skillService;
        private readonly IOpportunityDifficultyService _opportunityDifficultyService;
        private readonly IOpportunityVerificationTypeService _opportunityVerificationTypeService;
        private readonly ITimeIntervalService _timeIntervalService;

        private readonly OpportunityRequestValidatorCreate _opportunityRequestValidatorCreate;
        private readonly OpportunityRequestValidatorUpdate _opportunityRequestValidatorUpdate;
        private readonly OpportunitySearchFilterValidator _searchFilterValidator;

        private readonly IRepositoryValueContainsWithNavigation<Models.Opportunity> _opportunityRepository;
        private readonly IRepository<OpportunityCategory> _opportunityCategoryRepository;
        private readonly IRepository<OpportunityCountry> _opportunityCountryRepository;
        private readonly IRepository<OpportunityLanguage> _opportunityLanguageRepository;
        private readonly IRepository<OpportunitySkill> _opportunitySkillRepository;
        private readonly IRepository<OpportunityVerificationType> _opportunityVerificationTypeRepository;

        public const string Keywords_Separator = ",";
        public const int Keywords_CombinedMaxLength = 500;
        private static readonly Status[] Statuses_Updatable = { Status.Active, Status.Inactive };
        private static readonly Status[] Statuses_Activatable = { Status.Inactive };
        private static readonly Status[] Statuses_CanDelete = { Status.Active, Status.Inactive };
        private static readonly Status[] Statuses_DeActivatable = { Status.Active, Status.Deleted, Status.Expired };
        #endregion

        #region Constructor
        public OpportunityService(IHttpContextAccessor httpContextAccessor,
            IOpportunityStatusService opportunityStatusService,
            IOpportunityCategoryService opportunityCategoryService,
            ICountryService countryService,
            IOrganizationService organizationService,
            IOrganizationStatusService organizationStatusService,
            IOpportunityTypeService opportunityTypeService,
            ILanguageService languageService,
            ISkillService skillService,
            IOpportunityDifficultyService opportunityDifficultyService,
            IOpportunityVerificationTypeService opportunityVerificationTypeService,
            ITimeIntervalService timeIntervalService,
            OpportunityRequestValidatorCreate opportunityRequestValidatorCreate,
            OpportunityRequestValidatorUpdate opportunityRequestValidatorUpdate,
            OpportunitySearchFilterValidator searchFilterValidator,
            IRepositoryValueContainsWithNavigation<Models.Opportunity> opportunityRepository,
            IRepository<OpportunityCategory> opportunityCategoryRepository,
            IRepository<OpportunityCountry> opportunityCountryRepository,
            IRepository<OpportunityLanguage> opportunityLanguageRepository,
            IRepository<OpportunitySkill> opportunitySkillRepository,
            IRepository<OpportunityVerificationType> opportunityVerificationTypeRepository)
        {
            _httpContextAccessor = httpContextAccessor;

            _opportunityStatusService = opportunityStatusService;
            _opportunityCategoryService = opportunityCategoryService;
            _countryService = countryService;
            _organizationService = organizationService;
            _organizationStatusService = organizationStatusService;
            _opportunityTypeService = opportunityTypeService;
            _languageService = languageService;
            _skillService = skillService;
            _opportunityDifficultyService = opportunityDifficultyService;
            _opportunityVerificationTypeService = opportunityVerificationTypeService;
            _timeIntervalService = timeIntervalService;

            _opportunityRequestValidatorCreate = opportunityRequestValidatorCreate;
            _opportunityRequestValidatorUpdate = opportunityRequestValidatorUpdate;
            _searchFilterValidator = searchFilterValidator;

            _opportunityRepository = opportunityRepository;
            _opportunityCategoryRepository = opportunityCategoryRepository;
            _opportunityCountryRepository = opportunityCountryRepository;
            _opportunityLanguageRepository = opportunityLanguageRepository;
            _opportunitySkillRepository = opportunitySkillRepository;
            _opportunityVerificationTypeRepository = opportunityVerificationTypeRepository;
        }
        #endregion

        #region Public Members
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

            result.SetPublished();

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

            result.SetPublished();

            return result;
        }

        public OpportunityInfo? GetInfoByTitleOrNull(string title, bool includeChildItems)
        {
            var result = GetByTitleOrNull(title, includeChildItems);
            if (result == null) return null;

            return result.ToOpportunityInfo();
        }

        public List<Models.Opportunity> Contains(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentNullException(nameof(value));
            value = value.Trim();

            return _opportunityRepository.Contains(_opportunityRepository.Query(), value).ToList();
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
                ValueContains = filter.ValueContains,
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

        public OpportunitySearchResults Search(OpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            _searchFilterValidator.ValidateAndThrow(filter);

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
            if (ensureOrganizationAuthorization && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
            {
                if (filter.Organizations != null)
                {
                    filter.Organizations = filter.Organizations.Distinct().ToList();
                    _organizationService.IsAdminsOf(filter.Organizations, true);
                }
                else
                    filter.Organizations = _organizationService.ListAdminsOf().Select(o => o.Id).ToList();
            }

            if (filter.Organizations != null)
                query = query.Where(o => filter.Organizations.Contains(o.OrganizationId));

            //types (explicitly specified)
            if (filter.Types != null)
            {
                filter.Types = filter.Types.Distinct().ToList();
                query = query.Where(o => filter.Types.Contains(o.TypeId));
            }

            //categories (explicitly specified)
            if (filter.Categories != null)
            {
                filter.Categories = filter.Categories.Distinct().ToList();
                var matchedOpportunities = _opportunityCategoryRepository.Query().Where(o => filter.Categories.Contains(o.CategoryId)).Select(o => o.OpportunityId).ToList();
                query = query.Where(o => matchedOpportunities.Contains(o.Id));
            }

            //languages
            if (filter.Languages != null)
            {
                filter.Languages = filter.Languages.Distinct().ToList();
                var matchedOpportunityIds = _opportunityLanguageRepository.Query().Where(o => filter.Languages.Contains(o.LanguageId)).Select(o => o.OpportunityId).ToList();
                query = query.Where(o => matchedOpportunityIds.Contains(o.Id));
            }

            //countries
            if (filter.Countries != null)
            {
                filter.Countries = filter.Countries.Distinct().ToList();
                var matchedOpportunityIds = _opportunityCountryRepository.Query().Where(o => filter.Countries.Contains(o.CountryId)).Select(o => o.OpportunityId).ToList();
                query = query.Where(o => matchedOpportunityIds.Contains(o.Id));
            }

            //statuses
            if (filter.IncludeExpired && !filter.Published)
                throw new InvalidOperationException($"'{nameof(filter.IncludeExpired)}' requires '{nameof(filter.Published)}'");

            if (filter.Published || filter.IncludeExpired)
            {
                filter.Statuses = new List<Status> { Status.Active };

                var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;
                query = query.Where(o => o.OrganizationStatusId == organizationStatusActiveId);

                if (filter.IncludeExpired) filter.Statuses.Add(Status.Expired);
            }

            if (filter.Statuses != null)
            {
                filter.Statuses = filter.Statuses.Distinct().ToList();
                var statusIds = filter.Statuses.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();
                query = query.Where(o => statusIds.Contains(o.StatusId));
            }

            //valueContains (includes organizations, types, categories, opportunities and skills)
            if (!string.IsNullOrEmpty(filter.ValueContains))
            {
                var predicate = PredicateBuilder.False<Models.Opportunity>();

                //organizations
                var matchedOrganizationIds = _organizationService.Contains(filter.ValueContains).Select(o => o.Id).ToList();
                predicate = predicate.Or(o => matchedOrganizationIds.Contains(o.OrganizationId));

                //types
                var matchedTypeIds = _opportunityTypeService.Contains(filter.ValueContains).Select(o => o.Id).ToList();
                predicate = predicate.Or(o => matchedTypeIds.Contains(o.TypeId));

                //categories
                var matchedCategoryIds = _opportunityCategoryService.Contains(filter.ValueContains).Select(o => o.Id).ToList();
                var matchedOpportunityIds = _opportunityCategoryRepository.Query().Where(o => matchedCategoryIds.Contains(o.CategoryId)).Select(o => o.OpportunityId).ToList();
                predicate = predicate.Or(o => matchedOpportunityIds.Contains(o.Id));

                //opportunities
                predicate = _opportunityRepository.Contains(predicate, filter.ValueContains);

                //skills
                var matchedSkillIds = _skillService.Contains(filter.ValueContains).Select(o => o.Id).ToList();
                matchedOpportunityIds = _opportunitySkillRepository.Query().Where(o => matchedSkillIds.Contains(o.SkillId)).Select(o => o.OpportunityId).ToList();
                predicate = predicate.Or(o => matchedOpportunityIds.Contains(o.Id));

                query = query.Where(predicate);
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
            results.Items.ForEach(o => o.SetPublished());

            return results;
        }

        public async Task<Models.Opportunity> Create(OpportunityRequestCreate request, bool ensureOrganizationAuthorization)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _opportunityRequestValidatorCreate.ValidateAndThrowAsync(request);

            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization);

            if (ensureOrganizationAuthorization)
                _organizationService.IsAdmin(request.OrganizationId, true);

            var existingByTitle = GetByTitleOrNull(request.Title, false);
            if (existingByTitle != null)
                throw new ValidationException($"{nameof(Models.Opportunity)} with the specified name '{request.Title}' already exists");

            var status = request.PostAsActive ? Status.Active : Status.Inactive;

            var result = new Models.Opportunity
            {
                Title = request.Title,
                Description = request.Description,
                TypeId = request.TypeId,
                Type = _opportunityTypeService.GetById(request.TypeId).Name,
                OrganizationId = request.OrganizationId,
                Organization = _organizationService.GetById(request.OrganizationId, false, false).Name,
                Instructions = request.Instructions,
                URL = request.URL,
                ZltoReward = request.ZltoReward,
                YomaReward = request.YomaReward,
                ZltoRewardPool = request.ZltoRewardPool,
                YomaRewardPool = request.YomaRewardPool,
                VerificationSupported = request.VerificationSupported,
                SSIIntegrated = request.SSIIntegrated,
                DifficultyId = request.DifficultyId,
                Difficulty = _opportunityDifficultyService.GetById(request.DifficultyId).Name,
                CommitmentIntervalId = request.CommitmentIntervalId,
                CommitmentInterval = _timeIntervalService.GetById(request.CommitmentIntervalId).Name,
                CommitmentIntervalCount = request.CommitmentIntervalCount,
                ParticipantLimit = request.ParticipantLimit,
                Keywords = request.Keywords == null ? null : string.Join(Keywords_Separator, request.Keywords),
                DateStart = request.DateStart.RemoveTime(),
                DateEnd = !request.DateEnd.HasValue ? null : request.DateEnd.Value.ToEndOfDay(),
                StatusId = _opportunityStatusService.GetByName(status.ToString()).Id,
                Status = status,
                CreatedBy = username
            };

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            result = await _opportunityRepository.Create(result);

            // categories
            result = await AssignCategories(result, request.Categories);

            // countries
            result = await AssignCountries(result, request.Countries);

            // languages
            result = await AssignLanguages(result, request.Languages);

            // skills (optional)
            result = await AssignSkills(result, request.Skills);

            // verification types (optional)
            if (request.VerificationSupported && (request.VerificationTypes == null || !request.VerificationTypes.Any()))
                throw new ValidationException("One or more verification types are required when verification is supported");

            result = await AssignVerificationTypes(result, request.VerificationTypes);

            scope.Complete();

            result.SetPublished();
            return result;
        }

        public async Task<Models.Opportunity> Update(OpportunityRequestUpdate request, bool ensureOrganizationAuthorization)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _opportunityRequestValidatorUpdate.ValidateAndThrowAsync(request);

            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization);

            if (ensureOrganizationAuthorization)
                _organizationService.IsAdmin(request.OrganizationId, true);

            var result = GetById(request.Id, true, false);

            ValidateUpdatable(result);

            var existingByTitle = GetByTitleOrNull(request.Title, false);
            if (existingByTitle != null && result.Id != existingByTitle.Id)
                throw new ValidationException($"{nameof(Models.Opportunity)} with the specified name '{request.Title}' already exists");

            //status remains unchanged (status updated via UpdateStatus)
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
            result.SSIIntegrated = request.SSIIntegrated;
            result.DifficultyId = request.DifficultyId;
            result.Difficulty = _opportunityDifficultyService.GetById(request.DifficultyId).Name;
            result.CommitmentIntervalId = request.CommitmentIntervalId;
            result.CommitmentInterval = _timeIntervalService.GetById(request.CommitmentIntervalId).Name;
            result.CommitmentIntervalCount = request.CommitmentIntervalCount;
            result.ParticipantLimit = request.ParticipantLimit;
            result.Keywords = request.Keywords == null ? null : string.Join(Keywords_Separator, request.Keywords);
            result.DateStart = request.DateStart.RemoveTime();
            result.DateEnd = !request.DateEnd.HasValue ? null : request.DateEnd.Value.ToEndOfDay();
            result.ModifiedBy = username;

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            await _opportunityRepository.Update(result);
            result.DateModified = DateTimeOffset.Now;

            // categories
            result = await RemoveCategories(result, result.Categories?.Where(o => !request.Categories.Contains(o.Id)).Select(o => o.Id).ToList());
            result = await AssignCategories(result, request.Categories);

            // countries
            result = await RemoveCountries(result, result.Countries?.Where(o => !request.Countries.Contains(o.Id)).Select(o => o.Id).ToList());
            result = await AssignCountries(result, request.Countries);

            // languages
            result = await RemoveLanguages(result, result.Languages?.Where(o => !request.Languages.Contains(o.Id)).Select(o => o.Id).ToList());
            result = await AssignLanguages(result, request.Languages);

            // skills (optional)
            result = await RemoveSkills(result, result.Skills?.Where(o => !request.Skills.Contains(o.Id)).Select(o => o.Id).ToList());
            result = await AssignSkills(result, request.Skills);

            // verification types (optional)
            if (request.VerificationSupported && (request.VerificationTypes == null || !request.VerificationTypes.Any()))
                throw new ValidationException("One or more verification types are required when verification is supported");

            result = await RemoveVerificationTypes(result, result.VerificationTypes?.Where(o => request.VerificationTypes == null || !request.VerificationTypes.ContainsKey(o.Type)).Select(o => o.Type).ToList());
            result = await AssignVerificationTypes(result, request.VerificationTypes);

            scope.Complete();

            result.SetPublished();
            return result;
        }

        public async Task<(decimal? ZltoReward, decimal? YomaReward)> AllocateRewards(Guid id, bool ensureOrganizationAuthorization)
        {
            var opportunity = GetById(id, false, ensureOrganizationAuthorization);

            //can complete, provided published (and started) or expired (action prior to expiration)
            var canComplete = opportunity.Published && opportunity.DateStart <= DateTimeOffset.Now;
            if (!canComplete) canComplete = opportunity.Status == Status.Expired;

            if (!canComplete)
                throw new ValidationException($"{nameof(Models.Opportunity)} rewards can no longer be allocated (published '{opportunity.Published}' | status '{opportunity.Status}' | start date '{opportunity.DateStart}')");

            var count = (opportunity.ParticipantCount ?? 0) + 1;
            if (opportunity.ParticipantLimit.HasValue && count > opportunity.ParticipantLimit.Value)
                throw new ValidationException($"Increment will exceed limit (current count '{opportunity.ParticipantCount ?? 0}' vs current limit '{opportunity.ParticipantLimit.Value}')");
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

        public async Task<Models.Opportunity> UpdateStatus(Guid id, Status status, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, false, ensureOrganizationAuthorization);

            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization);

            switch (status)
            {
                case Status.Active:
                    if (result.Status == Status.Active) return result;
                    if (!Statuses_Activatable.Contains(result.Status))
                        throw new ValidationException($"{nameof(Models.Opportunity)} can not be activated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Activatable)}'");

                    //ensure DateEnd was updated for re-activation of previously expired opportunities
                    if (result.DateEnd.HasValue && result.DateEnd <= DateTimeOffset.Now)
                        throw new ValidationException($"The {nameof(Models.Opportunity)} '{result.Title}' cannot be activated because its end date ('{result.DateEnd}') is in the past. Please update the {nameof(Models.Opportunity).ToLower()} before proceeding with activation.");

                    break;

                case Status.Inactive:
                    if (result.Status == Status.Inactive) return result;
                    if (!Statuses_DeActivatable.Contains(result.Status))
                        throw new ValidationException($"{nameof(Models.Opportunity)} can not be deactivated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_DeActivatable)}'");
                    break;

                case Status.Deleted:
                    if (result.Status == Status.Deleted) return result;
                    if (!Statuses_CanDelete.Contains(result.Status))
                        throw new ValidationException($"{nameof(Models.Opportunity)} can not be deleted (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_CanDelete)}'");

                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(status), $"{nameof(Status)} of '{status}' not supported");
            }

            var statusId = _opportunityStatusService.GetByName(status.ToString()).Id;

            result.StatusId = statusId;
            result.Status = status;
            result.ModifiedBy = username;

            await _opportunityRepository.Update(result);

            return result;
        }

        public async Task<Models.Opportunity> AssignCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, false, ensureOrganizationAuthorization);

            ValidateUpdatable(result);

            result = await AssignCategories(result, categoryIds);

            return result;
        }

        public async Task<Models.Opportunity> RemoveCategories(Guid id, List<Guid> categoryIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, false, ensureOrganizationAuthorization);

            if (categoryIds == null || !categoryIds.Any())
                throw new ArgumentNullException(nameof(categoryIds));

            ValidateUpdatable(result);

            result = await RemoveCategories(result, categoryIds);

            return result;
        }

        public async Task<Models.Opportunity> AssignCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, false, ensureOrganizationAuthorization);

            ValidateUpdatable(result);

            result = await AssignCountries(result, countryIds);

            return result;
        }

        public async Task<Models.Opportunity> RemoveCountries(Guid id, List<Guid> countryIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, false, ensureOrganizationAuthorization);

            if (countryIds == null || !countryIds.Any())
                throw new ArgumentNullException(nameof(countryIds));

            ValidateUpdatable(result);

            result = await RemoveCountries(result, countryIds);

            return result;
        }

        public async Task<Models.Opportunity> AssignLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, false, ensureOrganizationAuthorization);

            ValidateUpdatable(result);

            result = await AssignLanguages(result, languageIds);

            return result;
        }

        public async Task<Models.Opportunity> RemoveLanguages(Guid id, List<Guid> languageIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, false, ensureOrganizationAuthorization);

            if (languageIds == null || !languageIds.Any())
                throw new ArgumentNullException(nameof(languageIds));

            ValidateUpdatable(result);

            result = await RemoveLanguages(result, languageIds);

            return result;
        }

        public async Task<Models.Opportunity> AssignSkills(Guid id, List<Guid> skillIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, false, ensureOrganizationAuthorization);

            if (skillIds == null || !skillIds.Any())
                throw new ArgumentNullException(nameof(skillIds));

            ValidateUpdatable(result);

            result = await AssignSkills(result, skillIds);

            return result;
        }

        public async Task<Models.Opportunity> RemoveSkills(Guid id, List<Guid> skillIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, false, ensureOrganizationAuthorization);

            if (skillIds == null || !skillIds.Any())
                throw new ArgumentNullException(nameof(skillIds));

            ValidateUpdatable(result);

            result = await RemoveSkills(result, skillIds);

            return result;
        }

        public async Task<Models.Opportunity> AssignVerificationTypes(Guid id, Dictionary<VerificationType, string?> verificationTypes, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, false, ensureOrganizationAuthorization);

            if (verificationTypes == null || !verificationTypes.Any())
                throw new ArgumentNullException(nameof(verificationTypes));

            ValidateUpdatable(result);

            result = await AssignVerificationTypes(result, verificationTypes);

            return result;
        }

        public async Task<Models.Opportunity> RemoveVerificationTypes(Guid id, List<VerificationType> verificationTypes, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, false, ensureOrganizationAuthorization);

            if (verificationTypes == null || !verificationTypes.Any())
                throw new ArgumentNullException(nameof(verificationTypes));

            ValidateUpdatable(result);

            if (result.VerificationSupported && (result.VerificationTypes == null || result.VerificationTypes.All(o => verificationTypes.Contains(o.Type))))
                throw new ValidationException("One or more verification types are required when verification is supported. Removal will result in no associated verification types");

            result = await RemoveVerificationTypes(result, verificationTypes);

            return result;
        }
        #endregion

        #region Private Members
        private async Task<Models.Opportunity> AssignCountries(Models.Opportunity opportunity, List<Guid> countryIds)
        {
            if (countryIds == null || !countryIds.Any())
                throw new ArgumentNullException(nameof(countryIds));

            countryIds = countryIds.Distinct().ToList();

            var results = new List<Domain.Lookups.Models.Country>();

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var countryId in countryIds)
            {
                var country = _countryService.GetById(countryId);
                results.Add(country);

                var item = _opportunityCountryRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.CountryId == country.Id);

                if (item != null) continue;
                item = new OpportunityCountry
                {
                    OpportunityId = opportunity.Id,
                    CountryId = country.Id
                };

                await _opportunityCountryRepository.Create(item);

                opportunity.Countries ??= new List<Domain.Lookups.Models.Country>();
                opportunity.Countries.Add(new Domain.Lookups.Models.Country { Id = country.Id, Name = country.Name, CodeAlpha2 = country.CodeAlpha2, CodeAlpha3 = country.CodeAlpha3, CodeNumeric = country.CodeNumeric });
            }

            scope.Complete();

            return opportunity;
        }

        private async Task<Models.Opportunity> RemoveCountries(Models.Opportunity opportunity, List<Guid>? countryIds)
        {
            if (countryIds == null || !countryIds.Any()) return opportunity;

            countryIds = countryIds.Distinct().ToList();

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var countryId in countryIds)
            {
                var country = _countryService.GetById(countryId);

                var item = _opportunityCountryRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.CountryId == country.Id);
                if (item == null) continue;

                await _opportunityCountryRepository.Delete(item);

                opportunity.Countries?.Remove(opportunity.Countries.Single(o => o.Id == country.Id));
            }

            scope.Complete();

            return opportunity;
        }

        private async Task<Models.Opportunity> AssignCategories(Models.Opportunity opportunity, List<Guid> categoryIds)
        {
            if (categoryIds == null || !categoryIds.Any())
                throw new ArgumentNullException(nameof(categoryIds));

            categoryIds = categoryIds.Distinct().ToList();

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var categoryId in categoryIds)
            {
                var category = _opportunityCategoryService.GetById(categoryId);

                var item = _opportunityCategoryRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.CategoryId == category.Id);
                if (item != null) continue;

                item = new OpportunityCategory
                {
                    OpportunityId = opportunity.Id,
                    CategoryId = category.Id
                };

                await _opportunityCategoryRepository.Create(item);

                opportunity.Categories ??= new List<Models.Lookups.OpportunityCategory>();
                opportunity.Categories.Add(new Models.Lookups.OpportunityCategory { Id = category.Id, Name = category.Name });
            }

            scope.Complete();

            return opportunity;
        }

        private async Task<Models.Opportunity> RemoveCategories(Models.Opportunity opportunity, List<Guid>? categoryIds)
        {
            if (categoryIds == null || !categoryIds.Any()) return opportunity;

            categoryIds = categoryIds.Distinct().ToList();

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var categoryId in categoryIds)
            {
                var category = _opportunityCategoryService.GetById(categoryId);

                var item = _opportunityCategoryRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.CategoryId == category.Id);
                if (item == null) continue;

                await _opportunityCategoryRepository.Delete(item);

                opportunity.Categories?.Remove(opportunity.Categories.Single(o => o.Id == category.Id));
            }

            scope.Complete();

            return opportunity;
        }

        private async Task<Models.Opportunity> AssignLanguages(Models.Opportunity opportunity, List<Guid> languageIds)
        {
            if (languageIds == null || !languageIds.Any())
                throw new ArgumentNullException(nameof(languageIds));

            languageIds = languageIds.Distinct().ToList();

            var results = new List<Domain.Lookups.Models.Language>();

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var languageId in languageIds)
            {
                var language = _languageService.GetById(languageId);
                results.Add(language);

                var item = _opportunityLanguageRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.LanguageId == language.Id);
                if (item != null) continue;

                item = new OpportunityLanguage
                {
                    OpportunityId = opportunity.Id,
                    LanguageId = language.Id
                };

                await _opportunityLanguageRepository.Create(item);

                opportunity.Languages ??= new List<Domain.Lookups.Models.Language>();
                opportunity.Languages.Add(new Domain.Lookups.Models.Language { Id = language.Id, Name = language.Name, CodeAlpha2 = language.CodeAlpha2 });
            }

            scope.Complete();

            return opportunity;
        }

        private async Task<Models.Opportunity> RemoveLanguages(Models.Opportunity opportunity, List<Guid>? languageIds)
        {
            if (languageIds == null || !languageIds.Any()) return opportunity;

            languageIds = languageIds.Distinct().ToList();

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var languageId in languageIds)
            {
                var language = _languageService.GetById(languageId);

                var item = _opportunityLanguageRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.LanguageId == language.Id);
                if (item == null) continue;

                await _opportunityLanguageRepository.Delete(item);

                opportunity.Languages?.Remove(opportunity.Languages.Single(o => o.Id == language.Id));
            }

            scope.Complete();

            return opportunity;
        }

        private async Task<Models.Opportunity> AssignSkills(Models.Opportunity opportunity, List<Guid>? skillIds)
        {
            if (skillIds == null || !skillIds.Any()) return opportunity; //skills are optional

            skillIds = skillIds.Distinct().ToList();

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var skillId in skillIds)
            {
                var skill = _skillService.GetById(skillId);

                var item = _opportunitySkillRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.SkillId == skill.Id);
                if (item != null) continue;

                item = new OpportunitySkill
                {
                    OpportunityId = opportunity.Id,
                    SkillId = skill.Id
                };

                await _opportunitySkillRepository.Create(item);

                opportunity.Skills ??= new List<Domain.Lookups.Models.Skill>();
                opportunity.Skills.Add(new Domain.Lookups.Models.Skill { Id = skill.Id, Name = skill.Name, InfoURL = skill.InfoURL });
            }

            scope.Complete();

            return opportunity;
        }

        private async Task<Models.Opportunity> RemoveSkills(Models.Opportunity opportunity, List<Guid>? skillIds)
        {
            if (skillIds == null || !skillIds.Any()) return opportunity;

            skillIds = skillIds.Distinct().ToList();

            if (!Statuses_Updatable.Contains(opportunity.Status))
                throw new ValidationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var skillId in skillIds)
            {
                var skill = _skillService.GetById(skillId);

                var item = _opportunitySkillRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.SkillId == skill.Id);
                if (item == null) continue;

                await _opportunitySkillRepository.Delete(item);

                opportunity.Skills?.Remove(opportunity.Skills.Single(o => o.Id == skill.Id));
            }

            scope.Complete();

            return opportunity;
        }

        private async Task<Models.Opportunity> AssignVerificationTypes(Models.Opportunity opportunity, Dictionary<VerificationType, string?>? verificationTypes)
        {
            if (verificationTypes == null || !verificationTypes.Any()) return opportunity; //verification types is optional

            if (!Statuses_Updatable.Contains(opportunity.Status))
                throw new ValidationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");

            var results = new List<Models.Lookups.OpportunityVerificationType>();

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var type in verificationTypes)
            {
                var verificationType = _opportunityVerificationTypeService.GetByType(type.Key);
                results.Add(verificationType);

                var item = _opportunityVerificationTypeRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.VerificationTypeId == verificationType.Id);
                if (item != null) continue;

                var desc = type.Value?.Trim();
                if (string.IsNullOrEmpty(desc)) desc = null;

                item = new OpportunityVerificationType
                {
                    OpportunityId = opportunity.Id,
                    VerificationTypeId = verificationType.Id,
                    Description = desc
                };

                await _opportunityVerificationTypeRepository.Create(item);

                opportunity.VerificationTypes ??= new List<Models.Lookups.OpportunityVerificationType>();
                opportunity.VerificationTypes.Add(new Models.Lookups.OpportunityVerificationType
                {
                    Id = verificationType.Id,
                    Type = verificationType.Type,
                    DisplayName = verificationType.DisplayName,
                    Description = item.Description ?? verificationType.Description
                });
            }

            scope.Complete();

            return opportunity;
        }

        private async Task<Models.Opportunity> RemoveVerificationTypes(Models.Opportunity opportunity, List<VerificationType>? verificationTypes)
        {
            if (verificationTypes == null || !verificationTypes.Any()) return opportunity;

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var type in verificationTypes)
            {
                var verificationType = _opportunityVerificationTypeService.GetByType(type);

                var item = _opportunityVerificationTypeRepository.Query().SingleOrDefault(o => o.OpportunityId == opportunity.Id && o.VerificationTypeId == verificationType.Id);
                if (item == null) continue;

                await _opportunityVerificationTypeRepository.Delete(item);

                opportunity.VerificationTypes?.Remove(opportunity.VerificationTypes.Single(o => o.Id == verificationType.Id));
            }

            scope.Complete();

            return opportunity;
        }

        private static void ValidateUpdatable(Models.Opportunity opportunity)
        {
            if (!Statuses_Updatable.Contains(opportunity.Status))
                throw new ValidationException($"{nameof(Models.Opportunity)} can no longer be updated (current status '{opportunity.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");
        }

        #endregion
    }
}
