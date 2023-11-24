using FluentValidation;
using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Microsoft.Extensions.Options;
using Flurl;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.IdentityProvider.Helpers;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.SSI.Interfaces;

namespace Yoma.Core.Domain.Entity.Services
{
    public class OrganizationService : IOrganizationService
    {
        #region Class Variables
        private readonly ILogger<OrganizationService> _logger;
        private readonly AppSettings _appSettings;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserService _userService;
        private readonly IIdentityProviderClient _identityProviderClient;
        private readonly IOrganizationStatusService _organizationStatusService;
        private readonly IOrganizationProviderTypeService _providerTypeService;
        private readonly IBlobService _blobService;
        private readonly ISSITenantService _ssiTenantService;
        private readonly IEmailProviderClient _emailProviderClient;
        private readonly OrganizationRequestValidatorCreate _organizationCreateRequestValidator;
        private readonly OrganizationRequestValidatorUpdate _organizationUpdateRequestValidator;
        private readonly OrganizationSearchFilterValidator _organizationSearchFilterValidator;
        private readonly OrganizationRequestUpdateStatusValidator _organizationRequestUpdateStatusValidator;
        private readonly IRepositoryBatchedValueContainsWithNavigation<Organization> _organizationRepository;
        private readonly IRepository<OrganizationUser> _organizationUserRepository;
        private readonly IRepository<Models.OrganizationProviderType> _organizationProviderTypeRepository;
        private readonly IRepository<OrganizationDocument> _organizationDocumentRepository;

        private static readonly OrganizationStatus[] Statuses_Updatable = { OrganizationStatus.Active, OrganizationStatus.Inactive };
        private static readonly OrganizationStatus[] Statuses_Activatable = { OrganizationStatus.Inactive };
        private static readonly OrganizationStatus[] Statuses_CanDelete = { OrganizationStatus.Active, OrganizationStatus.Inactive, OrganizationStatus.Declined };
        private static readonly OrganizationStatus[] Statuses_DeActivatable = { OrganizationStatus.Active, OrganizationStatus.Declined, OrganizationStatus.Deleted };
        private static readonly OrganizationStatus[] Statuses_Declinable = { OrganizationStatus.Inactive };
        #endregion

        #region Constructor
        public OrganizationService(ILogger<OrganizationService> logger,
            IOptions<AppSettings> appSettings,
            IHttpContextAccessor httpContextAccessor,
            IUserService userService,
            IIdentityProviderClientFactory identityProviderClientFactory,
            IOrganizationStatusService organizationStatusService,
            IOrganizationProviderTypeService providerTypeService,
            IBlobService blobService,
            ISSITenantService ssiTenantService,
            IEmailProviderClientFactory emailProviderClientFactory,
            OrganizationRequestValidatorCreate organizationCreateRequestValidator,
            OrganizationRequestValidatorUpdate organizationUpdateRequestValidator,
            OrganizationSearchFilterValidator organizationSearchFilterValidator,
            OrganizationRequestUpdateStatusValidator organizationRequestUpdateStatusValidator,
            IRepositoryBatchedValueContainsWithNavigation<Organization> organizationRepository,
            IRepository<OrganizationUser> organizationUserRepository,
            IRepository<Models.OrganizationProviderType> organizationProviderTypeRepository,
            IRepository<OrganizationDocument> organizationDocumentRepository)
        {
            _logger = logger;
            _appSettings = appSettings.Value;
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _identityProviderClient = identityProviderClientFactory.CreateClient();
            _organizationStatusService = organizationStatusService;
            _providerTypeService = providerTypeService;
            _blobService = blobService;
            _ssiTenantService = ssiTenantService;
            _emailProviderClient = emailProviderClientFactory.CreateClient();
            _organizationCreateRequestValidator = organizationCreateRequestValidator;
            _organizationUpdateRequestValidator = organizationUpdateRequestValidator;
            _organizationSearchFilterValidator = organizationSearchFilterValidator;
            _organizationRequestUpdateStatusValidator = organizationRequestUpdateStatusValidator;
            _organizationRepository = organizationRepository;
            _organizationUserRepository = organizationUserRepository;
            _organizationProviderTypeRepository = organizationProviderTypeRepository;
            _organizationDocumentRepository = organizationDocumentRepository;
        }
        #endregion

        #region Public Members
        public bool Updatable(Guid id, bool throwNotFound)
        {
            var org = throwNotFound ? GetById(id, false, false, false) : GetByIdOrNull(id, false, false);
            if (org == null) return false;
            return Statuses_Updatable.Contains(org.Status);
        }

        public Organization GetById(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            var result = GetByIdOrNull(id, includeChildItems, includeComputed)
                ?? throw new ArgumentOutOfRangeException(nameof(id), $"{nameof(Organization)} with id '{id}' does not exist");

            if (ensureOrganizationAuthorization)
                IsAdmin(result, true);

            return result;
        }

        public Organization? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            var result = _organizationRepository.Query(includeChildItems).SingleOrDefault(o => o.Id == id);
            if (result == null) return null;

            if (includeComputed)
            {
                result.LogoURL = GetBlobObjectURL(result.LogoId);
                result.Documents?.ForEach(o => o.Url = GetBlobObjectURL(o.FileId));
            }

            return result;
        }

        public Organization? GetByNameOrNull(string name, bool includeChildItems, bool includeComputed)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            var result = _organizationRepository.Query(includeChildItems).SingleOrDefault(o => o.Name == name);
            if (result == null) return null;

            if (includeComputed)
            {
                result.LogoURL = GetBlobObjectURL(result.LogoId);
                result.Documents?.ForEach(o => o.Url = GetBlobObjectURL(o.FileId));
            }

            return result;
        }

        public Organization GetByApiKey(string apiKey)
        {
            throw new NotImplementedException();
        }

        public Organization GetByApiKeyOrNull(string apiKey)
        {
            throw new NotImplementedException();
        }

        public List<Organization> Contains(string value, bool includeComputed)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentNullException(nameof(value));
            value = value.Trim();

            var results = _organizationRepository.Contains(_organizationRepository.Query(), value).ToList();

            if (includeComputed)
                results.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoId));

            return results;
        }

        public OrganizationSearchResults Search(OrganizationSearchFilter filter, bool ensureOrganizationAuthorization)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            _organizationSearchFilterValidator.ValidateAndThrow(filter);

            var query = _organizationRepository.Query();

            var organizationIds = new List<Guid>();
            if (ensureOrganizationAuthorization && !HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor))
                organizationIds.AddRange(ListAdminsOf(false).Select(o => o.Id).ToList());

            if (filter.Statuses != null && filter.Statuses.Any())
            {
                filter.Statuses = filter.Statuses.Distinct().ToList();
                var statusIds = filter.Statuses.Select(o => _organizationStatusService.GetByName(o.ToString())).Select(o => o.Id).ToList();
                query = query.Where(o => statusIds.Contains(o.StatusId));
            }

            if (!string.IsNullOrEmpty(filter.ValueContains))
                query = _organizationRepository.Contains(query, filter.ValueContains);

            if (filter.Organizations != null && filter.Organizations.Any())
            {
                filter.Organizations = filter.Organizations.Distinct().ToList();
                organizationIds = organizationIds.Any() ? organizationIds.Intersect(filter.Organizations).ToList() : filter.Organizations;
            }

            if (organizationIds.Any())
                query = query.Where(o => organizationIds.Contains(o.Id));

            var results = new OrganizationSearchResults();
            query = query.OrderBy(o => o.Name);

            if (filter.PaginationEnabled)
            {
                results.TotalCount = query.Count();
                query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
            }

            var resultsInternal = query.ToList();
            resultsInternal.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoId));

            results.Items = resultsInternal.Select(o => o.ToInfo()).ToList();
            return results;
        }

        public async Task<Organization> Create(OrganizationRequestCreate request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _organizationCreateRequestValidator.ValidateAndThrowAsync(request);

            var existingByName = GetByNameOrNull(request.Name, false, false);
            if (existingByName != null)
                throw new ValidationException($"{nameof(Organization)} with the specified name '{request.Name}' already exists");

            var statusInactiveId = _organizationStatusService.GetByName(OrganizationStatus.Inactive.ToString()).Id;

            var result = new Organization
            {
                Name = request.Name,
                WebsiteURL = request.WebsiteURL,
                PrimaryContactName = request.PrimaryContactName,
                PrimaryContactEmail = request.PrimaryContactEmail,
                PrimaryContactPhone = request.PrimaryContactPhone,
                VATIN = request.VATIN,
                TaxNumber = request.TaxNumber,
                RegistrationNumber = request.RegistrationNumber,
                City = request.City,
                CountryId = request.CountryId,
                StreetAddress = request.StreetAddress,
                Province = request.Province,
                PostalCode = request.PostalCode,
                Tagline = request.Tagline,
                Biography = request.Biography,
                StatusId = statusInactiveId, //new organization defaults to inactive / unapproved
                Status = OrganizationStatus.Inactive
            };

            var blobObjects = new List<BlobObject>();

            try
            {
                using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
                //create org
                result = await _organizationRepository.Create(result);

                //assign provider types
                result = await AssignProviderTypes(result, request.ProviderTypes, false);

                //insert logo
                var resultLogo = await UpdateLogo(result, request.Logo);
                result = resultLogo.Organization;
                blobObjects.Add(resultLogo.ItemAdded);

                //assign admins
                var admins = request.AdminEmails ??= new List<string>();
                if (request.AddCurrentUserAsAdmin)
                {
                    var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
                    admins.Add(username);
                }
                result = await AssignAdmins(result, admins);

                //upload documents
                var resultDocuments = await AddDocuments(result, OrganizationDocumentType.Registration, request.RegistrationDocuments);
                result = resultDocuments.Organization;
                blobObjects.AddRange(resultDocuments.ItemsAdded);

                var isProviderTypeEducation = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Education.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
                if (isProviderTypeEducation && (request.EducationProviderDocuments == null || !request.EducationProviderDocuments.Any()))
                    throw new ValidationException($"Education provider type documents are required");

                if (request.EducationProviderDocuments != null && request.EducationProviderDocuments.Any())
                {
                    resultDocuments = await AddDocuments(result, OrganizationDocumentType.EducationProvider, request.EducationProviderDocuments);
                    result = resultDocuments.Organization;
                    blobObjects.AddRange(resultDocuments.ItemsAdded);
                }

                var isProviderTypeMarketplace = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Marketplace.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
                if (isProviderTypeMarketplace && (request.BusinessDocuments == null || !request.BusinessDocuments.Any()))
                    throw new ValidationException($"Business documents are required");

                if (request.BusinessDocuments != null && request.BusinessDocuments.Any())
                {
                    resultDocuments = await AddDocuments(result, OrganizationDocumentType.Business, request.BusinessDocuments);
                    result = resultDocuments.Organization;
                    blobObjects.AddRange(resultDocuments.ItemsAdded);
                }

                scope.Complete();
            }
            catch
            {
                //rollback created blobs
                if (blobObjects.Any())
                    foreach (var blob in blobObjects)
                        await _blobService.Delete(blob);
                throw;
            }

            await SendEmail(result, EmailProvider.EmailType.Organization_Approval_Requested);

            return result;
        }

        public async Task<Organization> Update(OrganizationRequestUpdate request, bool ensureOrganizationAuthorization)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _organizationUpdateRequestValidator.ValidateAndThrowAsync(request);

            var result = GetById(request.Id, true, true, ensureOrganizationAuthorization);

            var existingByName = GetByNameOrNull(request.Name, false, false);
            if (existingByName != null && result.Id != existingByName.Id)
                throw new ValidationException($"{nameof(Organization)} with the specified name '{request.Name}' already exists");

            result.Name = request.Name;
            result.WebsiteURL = request.WebsiteURL;
            result.PrimaryContactName = request.PrimaryContactName;
            result.PrimaryContactEmail = request.PrimaryContactEmail;
            result.PrimaryContactPhone = request.PrimaryContactPhone;
            result.VATIN = request.VATIN;
            result.TaxNumber = request.TaxNumber;
            result.RegistrationNumber = request.RegistrationNumber;
            result.City = request.City;
            result.CountryId = request.CountryId;
            result.StreetAddress = request.StreetAddress;
            result.Province = request.Province;
            result.PostalCode = request.PostalCode;
            result.Tagline = request.Tagline;
            result.Biography = request.Biography;

            ValidateUpdatable(result);

            var itemsAdded = new List<BlobObject>();
            var itemsDeleted = new List<(Guid FileId, IFormFile File)>();
            try
            {
                using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

                //update org
                result = await _organizationRepository.Update(result);

                //provider types
                result = await AssignProviderTypes(result, request.ProviderTypes, true);
                result = await RemoveProviderTypes(result, result.ProviderTypes?.Where(o => !request.ProviderTypes.Contains(o.Id)).Select(o => o.Id).ToList());

                //logo
                if (request.Logo != null)
                {
                    var resultLogo = await UpdateLogo(result, request.Logo);
                    result = resultLogo.Organization;
                    itemsAdded.Add(resultLogo.ItemAdded);
                    if (resultLogo.ItemDeleted != null) itemsDeleted.Add(resultLogo.ItemDeleted.Value);
                }

                //admins
                var admins = request.AdminEmails ??= new List<string>();
                if (request.AddCurrentUserAsAdmin)
                {
                    var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
                    admins.Add(username);
                }
                result = await RemoveAdmins(result, result.Administrators?.Where(o => !admins.Contains(o.Email)).Select(o => o.Email).ToList());
                result = await AssignAdmins(result, admins);

                //documents
                if (request.RegistrationDocuments != null && request.RegistrationDocuments.Any())
                {
                    var resultDocuments = await AddDocuments(result, OrganizationDocumentType.Registration, request.RegistrationDocuments);
                    result = resultDocuments.Organization;
                    itemsAdded.AddRange(resultDocuments.ItemsAdded);
                }

                if (request.RegistrationDocumentsDelete != null && request.RegistrationDocumentsDelete.Any())
                {
                    if (result.Documents == null || result.Documents.Where(o => o.Type == OrganizationDocumentType.Registration).All(o => request.RegistrationDocumentsDelete.Contains(o.FileId)))
                        throw new ValidationException("Registration documents are required. Update will result in no associated documents");

                    var resultDelete = await DeleteDocuments(result, OrganizationDocumentType.Registration, request.RegistrationDocumentsDelete);
                    resultDelete.ItemsDeleted?.ForEach(o => itemsDeleted.Add(new(o.FileId, o.File)));
                    result = resultDelete.Organization;
                }

                if (request.EducationProviderDocuments != null && request.EducationProviderDocuments.Any())
                {
                    var resultDocuments = await AddDocuments(result, OrganizationDocumentType.EducationProvider, request.EducationProviderDocuments);
                    result = resultDocuments.Organization;
                    itemsAdded.AddRange(resultDocuments.ItemsAdded);
                }

                if (request.EducationProviderDocumentsDelete != null && request.EducationProviderDocumentsDelete.Any())
                {
                    var isProviderTypeEducation = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Education.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
                    if (isProviderTypeEducation && (result.Documents == null || result.Documents.Where(o => o.Type == OrganizationDocumentType.EducationProvider).All(o => request.EducationProviderDocumentsDelete.Contains(o.FileId))))
                        throw new ValidationException("Education provider type documents are required. Update will result in no associated documents");

                    var resultDelete = await DeleteDocuments(result, OrganizationDocumentType.EducationProvider, request.EducationProviderDocumentsDelete);
                    resultDelete.ItemsDeleted?.ForEach(o => itemsDeleted.Add(new(o.FileId, o.File)));
                    result = resultDelete.Organization;
                }

                if (request.BusinessDocuments != null && request.BusinessDocuments.Any())
                {
                    var resultDocuments = await AddDocuments(result, OrganizationDocumentType.Business, request.RegistrationDocuments);
                    result = resultDocuments.Organization;
                    itemsAdded.AddRange(resultDocuments.ItemsAdded);
                }

                if (request.BusinessDocumentsDelete != null && request.BusinessDocumentsDelete.Any())
                {
                    var isProviderTypeMarketplace = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Marketplace.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
                    if (isProviderTypeMarketplace && (result.Documents == null || result.Documents.Where(o => o.Type == OrganizationDocumentType.Business).All(o => request.BusinessDocumentsDelete.Contains(o.FileId))))
                        throw new ValidationException($"Business documents are required. Update will result in no associated documents");

                    var resultDelete = await DeleteDocuments(result, OrganizationDocumentType.Business, request.BusinessDocumentsDelete);
                    resultDelete.ItemsDeleted?.ForEach(o => itemsDeleted.Add(new(o.FileId, o.File)));
                    result = resultDelete.Organization;
                }

                scope.Complete();
            }
            catch
            {
                //rollback created blobs
                if (itemsAdded.Any())
                    foreach (var blob in itemsAdded)
                        await _blobService.Delete(blob);

                //re-upload deleted items to blob storage
                foreach (var item in itemsDeleted)
                    await _blobService.Create(item.FileId, item.File);

                throw;
            }

            return result;
        }

        public async Task<Organization> UpdateStatus(Guid id, OrganizationRequestUpdateStatus request, bool ensureOrganizationAuthorization)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _organizationRequestUpdateStatusValidator.ValidateAndThrowAsync(request);

            var result = GetById(id, true, true, ensureOrganizationAuthorization);

            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization);

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

            switch (request.Status)
            {
                case OrganizationStatus.Active:
                    if (result.Status == OrganizationStatus.Active) return result;

                    if (!Statuses_Activatable.Contains(result.Status))
                        throw new ValidationException($"{nameof(Organization)} can not be activated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Activatable)}'");

                    if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

                    result.CommentApproval = request.Comment;

                    await _ssiTenantService.ScheduleCreation(EntityType.Organization, result.Id);

                    await SendEmail(result, EmailProvider.EmailType.Organization_Approval_Approved);

                    break;

                case OrganizationStatus.Inactive:
                    if (result.Status == OrganizationStatus.Inactive) return result;

                    if (!Statuses_DeActivatable.Contains(result.Status))
                        throw new ValidationException($"{nameof(Organization)} can not be deactivated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_DeActivatable)}'");

                    if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

                    await SendEmail(result, EmailProvider.EmailType.Organization_Approval_Requested);
                    break;

                case OrganizationStatus.Declined:
                    if (result.Status == OrganizationStatus.Declined) return result;

                    if (!Statuses_Declinable.Contains(result.Status))
                        throw new ValidationException($"{nameof(Organization)} can not be declined (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Declinable)}'");

                    if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

                    result.CommentApproval = request.Comment;

                    await SendEmail(result, EmailProvider.EmailType.Organization_Approval_Declined);

                    break;

                case OrganizationStatus.Deleted:
                    if (result.Status == OrganizationStatus.Deleted) return result;

                    if (!Statuses_CanDelete.Contains(result.Status))
                        throw new ValidationException($"{nameof(Organization)} can not be deleted (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_CanDelete)}'");
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(request), $"{nameof(Status)} of '{request.Status}' not supported");
            }

            var statusId = _organizationStatusService.GetByName(request.Status.ToString()).Id;

            result.StatusId = statusId;
            result.Status = request.Status;

            result = await _organizationRepository.Update(result);

            scope.Complete();

            return result;
        }

        public async Task<Organization> AssignProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, true, ensureOrganizationAuthorization);

            ValidateUpdatable(result);

            result = await AssignProviderTypes(result, providerTypeIds, true);

            return result;
        }

        public async Task<Organization> RemoveProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, true, ensureOrganizationAuthorization);

            if (providerTypeIds == null || !providerTypeIds.Any())
                throw new ArgumentNullException(nameof(providerTypeIds));

            ValidateUpdatable(result);

            if (result.ProviderTypes == null || result.ProviderTypes.All(o => providerTypeIds.Contains(o.Id)))
                throw new ValidationException("One or more provider types are required. Removal will result in no associated provider types");

            result = await RemoveProviderTypes(result, providerTypeIds);

            return result;
        }

        //TODO: Ensure file name remains the same; utilize organization id
        public async Task<Organization> UpdateLogo(Guid id, IFormFile? file, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, true, ensureOrganizationAuthorization);

            ValidateUpdatable(result);

            var resultLogo = await UpdateLogo(result, file);

            return resultLogo.Organization;
        }

        public async Task<Organization> AddDocuments(Guid id, OrganizationDocumentType type, List<IFormFile> documents, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, true, ensureOrganizationAuthorization);

            ValidateUpdatable(result);

            var resultDocuments = await AddDocuments(result, type, documents);

            return resultDocuments.Organization;
        }

        public async Task<Organization> DeleteDocuments(Guid id, OrganizationDocumentType type, List<Guid> documentFileIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, true, ensureOrganizationAuthorization);

            ValidateUpdatable(result);

            if (result.Documents == null || result.Documents.Where(o => o.Type == OrganizationDocumentType.Registration).All(o => documentFileIds.Contains(o.FileId)))
                throw new ValidationException("Registration documents are required. Removal will result in no associated documents");

            var isProviderTypeEducation = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Education.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
            if (isProviderTypeEducation && (result.Documents == null || result.Documents.Where(o => o.Type == OrganizationDocumentType.EducationProvider).All(o => documentFileIds.Contains(o.FileId))))
                throw new ValidationException("Education provider type documents are required. Removal will result in no associated documents");

            var isProviderTypeMarketplace = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Marketplace.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
            if (isProviderTypeMarketplace && (result.Documents == null || result.Documents.Where(o => o.Type == OrganizationDocumentType.Business).All(o => documentFileIds.Contains(o.FileId))))
                throw new ValidationException($"Business documents are required. Removal will result in no associated documents");

            var resultDelete = await DeleteDocuments(result, type, documentFileIds);

            return resultDelete.Organization;
        }

        public async Task<Organization> AssignAdmins(Guid id, List<string> emails, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, true, ensureOrganizationAuthorization);

            ValidateUpdatable(result);

            result = await AssignAdmins(result, emails);

            return result;
        }

        public async Task<Organization> RemoveAdmins(Guid id, List<string> emails, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, true, ensureOrganizationAuthorization);

            if (emails == null || !emails.Any())
                throw new ArgumentNullException(nameof(emails));

            ValidateUpdatable(result);

            result = await RemoveAdmins(result, emails);

            return result;
        }

        public bool IsAdmin(Guid id, bool throwUnauthorized)
        {
            var org = GetById(id, false, false, false);
            return IsAdmin(org, throwUnauthorized);
        }

        public bool IsAdminsOf(List<Guid> ids, bool throwUnauthorized)
        {
            if (!ids.Any()) throw new ArgumentNullException(nameof(ids));

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
            var orgIds = _organizationUserRepository.Query().Where(o => o.UserId == user.Id).Select(o => o.OrganizationId).ToList();

            var result = !ids.Except(orgIds).Any();
            if (!result && throwUnauthorized)
                throw new SecurityException("Unauthorized");

            return result;
        }

        public List<UserInfo>? ListAdmins(Guid id, bool includeComputed, bool ensureOrganizationAuthorization)
        {
            var org = GetById(id, true, includeComputed, ensureOrganizationAuthorization);
            return org.Administrators;
        }

        public List<OrganizationInfo> ListAdminsOf(bool includeComputed)
        {
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
            var orgIds = _organizationUserRepository.Query().Where(o => o.UserId == user.Id).Select(o => o.OrganizationId).ToList();

            var organizations = _organizationRepository.Query().Where(o => orgIds.Contains(o.Id)).ToList();
            if (includeComputed) organizations.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoId));
            return organizations.Select(o => o.ToInfo()).ToList();
        }
        #endregion

        #region Private Members
        private bool IsAdmin(Organization organization, bool throwUnauthorized)
        {
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

            OrganizationUser? orgUser = null;
            var isAdmin = HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor);
            if (!isAdmin) orgUser = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == organization.Id && o.UserId == user.Id);

            if (!isAdmin && orgUser == null && throwUnauthorized)
                throw new SecurityException("Unauthorized");
            return true;
        }

        private async Task<Organization> AssignProviderTypes(Organization organization, List<Guid> providerTypeIds, bool sendForReapproval)
        {
            if (providerTypeIds == null || !providerTypeIds.Any())
                throw new ArgumentNullException(nameof(providerTypeIds));

            var typesAdded = false;
            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var typeId in providerTypeIds)
            {
                var type = _providerTypeService.GetById(typeId);

                var itemExisting = organization.ProviderTypes?.SingleOrDefault(o => o.Id == type.Id);
                if (itemExisting != null) continue;

                var item = new Models.OrganizationProviderType
                {
                    OrganizationId = organization.Id,
                    ProviderTypeId = type.Id
                };

                await _organizationProviderTypeRepository.Create(item);

                organization.ProviderTypes ??= new List<Models.Lookups.OrganizationProviderType>();
                organization.ProviderTypes.Add(new Models.Lookups.OrganizationProviderType { Id = type.Id, Name = type.Name });

                typesAdded = true;
            }

            if (sendForReapproval && typesAdded)
            {
                //with type addition organization is send for re-approval; all related opportunities will temporarily disappear from the listings
                var statusInactiveId = _organizationStatusService.GetByName(OrganizationStatus.Inactive.ToString()).Id;
                organization.StatusId = statusInactiveId;
                organization.Status = OrganizationStatus.Inactive;
                organization = await _organizationRepository.Update(organization);

                await SendEmail(organization, EmailProvider.EmailType.Organization_Approval_Requested);
            }

            scope.Complete();

            return organization;
        }

        private async Task<Organization> RemoveProviderTypes(Organization organization, List<Guid>? providerTypeIds)
        {
            if (providerTypeIds == null || !providerTypeIds.Any()) return organization;

            providerTypeIds = providerTypeIds.Distinct().ToList();

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var typeId in providerTypeIds)
            {
                var type = _providerTypeService.GetById(typeId);

                var item = _organizationProviderTypeRepository.Query().SingleOrDefault(o => o.OrganizationId == organization.Id && o.ProviderTypeId == type.Id);
                if (item == null) continue;

                await _organizationProviderTypeRepository.Delete(item);

                organization.ProviderTypes?.Remove(organization.ProviderTypes.Single(o => o.Id == type.Id));
            }

            scope.Complete();

            return organization;
        }

        private async Task<(Organization Organization, BlobObject ItemAdded, (Guid Id, IFormFile File)? ItemDeleted)> UpdateLogo(
            Organization organization, IFormFile? file)
        {
            if (file == null)
                throw new ArgumentNullException(nameof(file));

            (Guid Id, IFormFile File)? currentLogo = null;
            if (organization.LogoId.HasValue)
                currentLogo = (organization.LogoId.Value, await _blobService.Download(organization.LogoId.Value));

            BlobObject? blobObject = null;
            try
            {
                using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
                blobObject = await _blobService.Create(file, FileType.Photos);
                organization.LogoId = blobObject.Id;
                organization = await _organizationRepository.Update(organization);

                if (currentLogo != null)
                    await _blobService.Delete(currentLogo.Value.Id);

                scope.Complete();
            }
            catch
            {
                if (blobObject != null)
                    await _blobService.Delete(blobObject);

                if (currentLogo != null)
                    await _blobService.Create(currentLogo.Value.Id, currentLogo.Value.File);

                throw;
            }

            organization.LogoURL = GetBlobObjectURL(organization.LogoId);

            return (organization, blobObject, currentLogo);
        }

        private async Task<Organization> AssignAdmins(Organization organization, List<string> emails)
        {
            if (emails == null || !emails.Any())
                throw new ArgumentNullException(nameof(emails));

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var email in emails)
            {
                var user = _userService.GetByEmail(email, false, false);
                if (!user.ExternalId.HasValue)
                    throw new InvalidOperationException($"External id expected for user with id '{user.Id}'");

                var item = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == organization.Id && o.UserId == user.Id);
                if (item != null) continue;

                item = new OrganizationUser
                {
                    OrganizationId = organization.Id,
                    UserId = user.Id
                };

                await _organizationUserRepository.Create(item);

                await _identityProviderClient.EnsureRoles(user.ExternalId.Value, new List<string> { Constants.Role_OrganizationAdmin });

                organization.Administrators ??= new List<UserInfo>();
                organization.Administrators.Add(user.ToInfo());
            }

            scope.Complete();

            return organization;
        }

        private async Task<Organization> RemoveAdmins(Organization organization, List<string>? emails)
        {
            if (emails == null || !emails.Any()) return organization;

            emails = emails.Distinct().ToList();

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var email in emails)
            {
                var user = _userService.GetByEmail(email, false, false);
                if (!user.ExternalId.HasValue)
                    throw new InvalidOperationException($"External id expected for user with id '{user.Id}'");

                var item = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == organization.Id && o.UserId == user.Id);
                if (item == null) continue;

                await _organizationUserRepository.Delete(item);

                await _identityProviderClient.RemoveRoles(user.ExternalId.Value, new List<string> { Constants.Role_OrganizationAdmin });

                organization.Administrators?.Remove(organization.Administrators.Single(o => o.Id == user.Id));
            }

            scope.Complete();

            return organization;
        }

        private async Task<(Organization Organization, List<BlobObject> ItemsAdded)> AddDocuments(Organization organization, OrganizationDocumentType type, List<IFormFile>? documents)
        {
            if (documents == null || !documents.Any())
                throw new ArgumentNullException(nameof(documents));

            var itemsNew = new List<OrganizationDocument>();
            var itemsNewBlobs = new List<BlobObject>();
            try
            {
                using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

                //new items
                foreach (var file in documents)
                {
                    //upload new item to blob storage
                    var blobObject = await _blobService.Create(file, FileType.Documents);
                    itemsNewBlobs.Add(blobObject);

                    var item = new OrganizationDocument
                    {
                        OrganizationId = organization.Id,
                        FileId = blobObject.Id,
                        Type = type,
                        ContentType = file.ContentType,
                        OriginalFileName = file.FileName,
                        DateCreated = DateTimeOffset.Now
                    };

                    //create new item in db
                    item = await _organizationDocumentRepository.Create(item);
                    itemsNew.Add(item);
                }

                scope.Complete();
            }
            catch //roll back
            {
                //delete newly create items in blob storage
                foreach (var item in itemsNewBlobs)
                    await _blobService.Delete(item);

                throw;
            }

            organization.Documents ??= new List<OrganizationDocument>();
            organization.Documents.AddRange(itemsNew);
            organization.Documents?.ForEach(o => o.Url = GetBlobObjectURL(o.FileId));

            return (organization, itemsNewBlobs);
        }

        private async Task<(Organization Organization, List<OrganizationDocument>? ItemsDeleted)> DeleteDocuments(Organization organization,
            OrganizationDocumentType type, List<Guid>? documentFileIds)
        {
            if (documentFileIds == null || !documentFileIds.Any()) return (organization, null);

            documentFileIds = documentFileIds.Distinct().ToList();

            var itemsExistingDeleted = new List<OrganizationDocument>();
            var itemsExisting = organization.Documents?.Where(o => o.Type == type && documentFileIds.Contains(o.FileId)).ToList();
            if (itemsExisting == null || !itemsExisting.Any()) return (organization, null);

            try
            {
                using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

                //download and delete existing items in blob storage and db
                foreach (var item in itemsExisting)
                {
                    item.File = await _blobService.Download(item.FileId);
                    await _organizationDocumentRepository.Delete(item);
                    await _blobService.Delete(item.FileId);
                    itemsExistingDeleted.Add(item);
                }

                scope.Complete();
            }
            catch //roll back
            {
                //re-upload existing items to blob storage
                foreach (var item in itemsExistingDeleted)
                    await _blobService.Create(item.FileId, item.File);

                throw;
            }

            organization.Documents = organization.Documents?.Except(itemsExisting).ToList();

            return (organization, itemsExisting);
        }

        private string GetBlobObjectURL(Guid id)
        {
            return _blobService.GetURL(id);
        }

        private string? GetBlobObjectURL(Guid? id)
        {
            if (!id.HasValue) return null;
            return GetBlobObjectURL(id.Value);
        }

        private static void ValidateUpdatable(Organization organization)
        {
            if (!Statuses_Updatable.Contains(organization.Status))
                throw new ValidationException($"{nameof(Organization)} '{organization.Name}' can no longer be updated (current status '{organization.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");
        }

        private async Task SendEmail(Organization organization, EmailProvider.EmailType type)
        {
            List<EmailRecipient>? recipients = null;
            try
            {
                var dataOrg = new EmailOrganizationApprovalItem { Name = organization.Name };
                switch (type)
                {
                    case EmailProvider.EmailType.Organization_Approval_Requested:
                        //send email to super administrators
                        var superAdmins = await _identityProviderClient.ListByRole(Constants.Role_Admin);
                        recipients = superAdmins?.Select(o => new EmailRecipient { Email = o.Email, DisplayName = o.ToDisplayName() }).ToList();

                        dataOrg.URL = _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organization.Id).AppendPathSegment("verify").ToUri().ToString();
                        break;

                    case EmailProvider.EmailType.Organization_Approval_Approved:
                    case EmailProvider.EmailType.Organization_Approval_Declined:
                        //send email to organization administrators
                        recipients = organization.Administrators?.Select(o => new EmailRecipient { Email = o.Email, DisplayName = o.DisplayName }).ToList();

                        dataOrg.Comment = organization.CommentApproval;
                        dataOrg.URL = _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organization.Id).ToUri().ToString();
                        break;

                    default:
                        throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported");
                }

                if (recipients == null || !recipients.Any()) return;

                var data = new EmailOrganizationApproval
                {
                    Organizations = new List<EmailOrganizationApprovalItem>() { dataOrg }
                };

                await _emailProviderClient.Send(type, recipients, data);

                _logger.LogInformation("Successfully send '{emailType}' email", type);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send '{emailType}' email", type);
            }
        }
        #endregion
    }
}
