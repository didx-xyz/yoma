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
using Yoma.Core.Domain.Entity.Helpers;

namespace Yoma.Core.Domain.Entity.Services
{
    public class OrganizationService : IOrganizationService
    {
        #region Class Variables
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserService _userService;
        private readonly IIdentityProviderClient _identityProviderClient;
        private readonly IOrganizationStatusService _organizationStatusService;
        private readonly IOrganizationProviderTypeService _providerTypeService;
        private readonly IBlobService _blobService;
        private readonly OrganizationRequestValidatorCreate _organizationCreateRequestValidator;
        private readonly OrganizationRequestValidatorUpdate _organizationUpdateRequestValidator;
        private readonly OrganizationSearchFilterValidator _organizationSearchFilterValidator;
        private readonly OrganizationRequestUpdateStatusValidator _organizationRequestUpdateStatusValidator;
        private readonly IRepositoryValueContainsWithNavigation<Organization> _organizationRepository;
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
        public OrganizationService(IHttpContextAccessor httpContextAccessor,
            IUserService userService,
            IIdentityProviderClientFactory identityProviderClientFactory,
            IOrganizationStatusService organizationStatusService,
            IOrganizationProviderTypeService providerTypeService,
            IBlobService blobService,
            OrganizationRequestValidatorCreate organizationCreateRequestValidator,
            OrganizationRequestValidatorUpdate organizationUpdateRequestValidator,
            OrganizationSearchFilterValidator organizationSearchFilterValidator,
            OrganizationRequestUpdateStatusValidator organizationRequestUpdateStatusValidator,
            IRepositoryValueContainsWithNavigation<Organization> organizationRepository,
            IRepository<OrganizationUser> organizationUserRepository,
            IRepository<Models.OrganizationProviderType> organizationProviderTypeRepository,
            IRepository<OrganizationDocument> organizationDocumentRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _identityProviderClient = identityProviderClientFactory.CreateClient();
            _organizationStatusService = organizationStatusService;
            _providerTypeService = providerTypeService;
            _blobService = blobService;
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
            var org = throwNotFound ? GetById(id, false, false) : GetByIdOrNull(id, false);
            if (org == null) return false;
            return Statuses_Updatable.Contains(org.Status);
        }

        public Organization GetById(Guid id, bool includeChildItems, bool ensureOrganizationAuthorization)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            var result = GetByIdOrNull(id, includeChildItems)
                ?? throw new ArgumentOutOfRangeException(nameof(id), $"{nameof(Organization)} with id '{id}' does not exist");

            if (ensureOrganizationAuthorization)
                IsAdmin(result, true);

            return result;
        }

        public Organization? GetByIdOrNull(Guid id, bool includeChildItems)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            var result = _organizationRepository.Query(includeChildItems).SingleOrDefault(o => o.Id == id);
            if (result == null) return null;

            result.LogoURL = GetBlobObjectURL(result.LogoId);
            result.Documents?.ForEach(o => o.Url = _blobService.GetURL(o.FileId));
            result.Administrators = ListAdmins(result);

            return result;
        }

        public Organization? GetByNameOrNull(string name, bool includeChildItems)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            var result = _organizationRepository.Query(includeChildItems).SingleOrDefault(o => o.Name == name);
            if (result == null) return null;

            result.LogoURL = GetBlobObjectURL(result.LogoId);
            result.Documents?.ForEach(o => o.Url = _blobService.GetURL(o.FileId));
            result.Administrators = ListAdmins(result);

            return result;
        }

        public List<Organization> Contains(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentNullException(nameof(value));
            value = value.Trim();

            return _organizationRepository.Contains(_organizationRepository.Query(), value).ToList();
        }

        public OrganizationSearchResults Search(OrganizationSearchFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            _organizationSearchFilterValidator.ValidateAndThrow(filter);

            var query = _organizationRepository.Query();

            if (filter.Statuses != null)
            {
                filter.Statuses = filter.Statuses.Distinct().ToList();
                var statusIds = filter.Statuses.Select(o => _organizationStatusService.GetByName(o.ToString())).Select(o => o.Id).ToList();
                query = query.Where(o => statusIds.Contains(o.StatusId));
            }

            if (!string.IsNullOrEmpty(filter.ValueContains))
                query = _organizationRepository.Contains(query, filter.ValueContains);

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

            var existingByName = GetByNameOrNull(request.Name, false);
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
                var resultLogo = await UpsertLogo(result, request.Logo);
                result = resultLogo.Organization;
                blobObjects.Add(resultLogo.BlobOject);

                //assign admins
                var admins = request.AdminAdditionalEmails ??= new List<string>();
                if (request.AddCurrentUserAsAdmin)
                {
                    var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
                    admins.Add(username);
                }
                result = await AssignAdmins(result, admins);

                //upload documents
                var resultDocuments = await UpsertDocuments(result, OrganizationDocumentType.Registration, request.RegistrationDocuments);
                result = resultDocuments.Organization;
                blobObjects.AddRange(resultDocuments.BlobObjects);

                var isProviderTypeEducation = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Education.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
                if (isProviderTypeEducation && (request.EducationProviderDocuments == null || !request.EducationProviderDocuments.Any()))
                    throw new ValidationException($"Education provider type documents are required");

                if (request.EducationProviderDocuments != null && request.EducationProviderDocuments.Any())
                {
                    resultDocuments = await UpsertDocuments(result, OrganizationDocumentType.EducationProvider, request.EducationProviderDocuments);
                    result = resultDocuments.Organization;
                    blobObjects.AddRange(resultDocuments.BlobObjects);
                }

                var isProviderTypeMarketplace = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Marketplace.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
                if (isProviderTypeMarketplace && (request.BusinessDocuments == null || !request.BusinessDocuments.Any()))
                    throw new ValidationException($"Business documents are required");

                if (request.BusinessDocuments != null && request.BusinessDocuments.Any())
                {
                    resultDocuments = await UpsertDocuments(result, OrganizationDocumentType.Business, request.BusinessDocuments);
                    result = resultDocuments.Organization;
                    blobObjects.AddRange(resultDocuments.BlobObjects);
                }

                //TODO: Send email to SAP admins

                scope.Complete();
            }
            catch
            {
                //rollback created blobs
                if (blobObjects.Any())
                    foreach (var blob in blobObjects)
                        await _blobService.Delete(blob.Key);

                throw;
            }

            return result;
        }

        public async Task<Organization> Update(OrganizationRequestUpdate request, bool ensureOrganizationAuthorization)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _organizationUpdateRequestValidator.ValidateAndThrowAsync(request);

            var result = GetById(request.Id, true, ensureOrganizationAuthorization);

            var existingByName = GetByNameOrNull(request.Name, false);
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

            if (!Statuses_Updatable.Contains(result.Status))
                throw new ValidationException($"The {nameof(Organization)} cannot be updated in its current state, namely '{result.Status}'. Please change the status to one of the following: {string.Join(" / ", Statuses_Updatable)} before performing the update.");

            await _organizationRepository.Update(result);
            result.DateModified = DateTimeOffset.Now;

            return result;
        }

        public async Task<Organization> UpdateStatus(Guid id, OrganizationRequestUpdateStatus request, bool ensureOrganizationAuthorization)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _organizationRequestUpdateStatusValidator.ValidateAndThrowAsync(request);

            var result = GetById(id, false, ensureOrganizationAuthorization);

            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization);

            switch (request.Status)
            {
                case OrganizationStatus.Active:
                    if (result.Status == OrganizationStatus.Active) return result;

                    if (!Statuses_Activatable.Contains(result.Status))
                        throw new ValidationException($"{nameof(Organization)} can not be activated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Activatable)}'");

                    if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

                    //TODO: Send email to org admins

                    result.CommentApproval = request.Comment;
                    break;

                case OrganizationStatus.Inactive:
                    if (result.Status == OrganizationStatus.Inactive) return result;

                    if (!Statuses_DeActivatable.Contains(result.Status))
                        throw new ValidationException($"{nameof(Organization)} can not be deactivated (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_DeActivatable)}'");

                    if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

                    //TODO: Send email to SAP admins
                    break;

                case OrganizationStatus.Declined:
                    if (result.Status == OrganizationStatus.Declined) return result;

                    if (!Statuses_Declinable.Contains(result.Status))
                        throw new ValidationException($"{nameof(Organization)} can not be declined (current status '{result.Status}'). Required state '{string.Join(" / ", Statuses_Declinable)}'");

                    if (!HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor)) throw new SecurityException("Unauthorized");

                    //TODO: Send email to org admins

                    result.CommentApproval = request.Comment;
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

            await _organizationRepository.Update(result);

            return result;
        }

        public async Task<Organization> UpdateProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, ensureOrganizationAuthorization);

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            result = await AssignProviderTypes(result, providerTypeIds, true);
            result = await RemoveProviderTypes(result, result.ProviderTypes?.Where(o => !providerTypeIds.Contains(o.Id)).Select(o => o.Id).ToList());

            scope.Complete();

            return result;
        }

        public async Task<Organization> UpsertLogo(Guid id, IFormFile? file, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, ensureOrganizationAuthorization);

            var resultLogo = await UpsertLogo(result, file);

            return resultLogo.Organization;
        }

        public async Task<Organization> UpsertDocuments(Guid id, OrganizationDocumentType type, List<IFormFile> documents, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, ensureOrganizationAuthorization);

            var resultDocuments = await UpsertDocuments(result, type, documents);
            return resultDocuments.Organization;
        }

        public async Task<Organization> UpdateAdmins(Guid id, List<string> emails, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, false, ensureOrganizationAuthorization);

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            result = await AssignAdmins(result, emails);
            result = await RemoveAdmins(result, result.Administrators?.Where(o => !emails.Contains(o.Email)).Select(o => o.Email).ToList());

            scope.Complete();

            return result;
        }

        public bool IsAdmin(Guid id, bool throwUnauthorized)
        {
            var org = GetById(id, false, false);
            return IsAdmin(org, throwUnauthorized);
        }

        public bool IsAdminsOf(List<Guid> ids, bool throwUnauthorized)
        {
            if (!ids.Any()) throw new ArgumentNullException(nameof(ids));

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false);
            var orgIds = _organizationUserRepository.Query().Where(o => o.UserId == user.Id).Select(o => o.OrganizationId).ToList();

            var result = !ids.Except(orgIds).Any();
            if (!result && throwUnauthorized)
                throw new SecurityException("Unauthorized");

            return result;
        }

        public List<UserInfo> ListAdmins(Guid id, bool ensureOrganizationAuthorization)
        {
            var org = GetById(id, false, ensureOrganizationAuthorization);
            return ListAdmins(org);
        }

        public List<OrganizationInfo> ListAdminsOf()
        {
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false);
            var orgIds = _organizationUserRepository.Query().Where(o => o.UserId == user.Id).Select(o => o.OrganizationId).ToList();

            var results = _organizationRepository.Query().Where(o => orgIds.Contains(o.Id)).ToList();
            return results.Select(o => o.ToInfo()).ToList();
        }
        #endregion

        #region Private Members
        private List<UserInfo> ListAdmins(Organization organization)
        {
            var adminIds = _organizationUserRepository.Query().Where(o => o.OrganizationId == organization.Id).Select(o => o.UserId).ToList();

            var results = new List<User>();
            adminIds.ForEach(o => results.Add(_userService.GetById(o, false)));
            return results.Select(o => o.ToInfo()).ToList();
        }

        private bool IsAdmin(Organization organization, bool throwUnauthorized)
        {
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false);

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

            if (!Statuses_Updatable.Contains(organization.Status))
                throw new ValidationException($"{nameof(Organization)} '{organization.Name}' can no longer be updated (current status '{organization.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");

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
                await _organizationRepository.Update(organization);

                //TODO: Send email to SAP admins
            }

            scope.Complete();

            return organization;
        }

        private async Task<Organization> RemoveProviderTypes(Organization organization, List<Guid>? providerTypeIds)
        {
            if (providerTypeIds == null || !providerTypeIds.Any()) return organization;

            if (!Statuses_Updatable.Contains(organization.Status))
                throw new ValidationException($"{nameof(Organization)} '{organization.Name}' can no longer be updated (current status '{organization.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");

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

        private async Task<(Organization Organization, BlobObject BlobOject)> UpsertLogo(Organization organization, IFormFile? file)
        {
            if (file == null)
                throw new ArgumentNullException(nameof(file));

            if (!Statuses_Updatable.Contains(organization.Status))
                throw new ValidationException($"{nameof(Organization)} '{organization.Name}' can no longer be updated (current status '{organization.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");

            var currentLogo = organization.LogoId.HasValue ? new { Id = organization.LogoId.Value, File = await _blobService.Download(organization.LogoId.Value) } : null;

            BlobObject? blobObject = null;
            try
            {
                using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
                blobObject = await _blobService.Create(file, FileType.Photos);
                organization.LogoId = blobObject.Id;
                await _organizationRepository.Update(organization);

                if (currentLogo != null)
                    await _blobService.Delete(currentLogo.Id);

                scope.Complete();
            }
            catch
            {
                if (blobObject != null)
                    await _blobService.Delete(blobObject.Key);

                if (currentLogo != null)
                    await _blobService.Create(currentLogo.Id, currentLogo.File, FileType.Photos);

                throw;
            }

            organization.LogoURL = GetBlobObjectURL(organization.LogoId);

            return (organization, blobObject);
        }

        private async Task<Organization> AssignAdmins(Organization organization, List<string> emails)
        {
            if (emails == null || !emails.Any())
                throw new ArgumentNullException(nameof(emails));

            if (!Statuses_Updatable.Contains(organization.Status))
                throw new ValidationException($"{nameof(Organization)} '{organization.Name}' can no longer be updated (current status '{organization.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var email in emails)
            {
                var user = _userService.GetByEmail(email, false);
                if (!user.ExternalId.HasValue)
                    throw new InvalidOperationException($"External id expected for user with id '{user.Id}'");

                var item = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == organization.Id && o.UserId == user.Id);
                if (item != null) return organization;

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

            if (!Statuses_Updatable.Contains(organization.Status))
                throw new ValidationException($"{nameof(Organization)} '{organization.Name}' can no longer be updated (current status '{organization.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var email in emails)
            {
                var user = _userService.GetByEmail(email, false);
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

        private async Task<(Organization Organization, List<BlobObject> BlobObjects)> UpsertDocuments(Organization organization, OrganizationDocumentType type, List<IFormFile> documents)
        {
            if (documents == null || !documents.Any())
                throw new ArgumentNullException(nameof(documents));

            if (!Statuses_Updatable.Contains(organization.Status))
                throw new ValidationException($"{nameof(Organization)} '{organization.Name}' can no longer be updated (current status '{organization.Status}'). Required state '{string.Join(" / ", Statuses_Updatable)}'");

            var itemsNew = new List<OrganizationDocument>();
            var itemsExisting = new List<OrganizationDocument>();
            var itemsExistingDeleted = new List<OrganizationDocument>();
            var itemsNewBlobs = new List<BlobObject>();
            try
            {
                using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
                var itemsExistingByType = organization.Documents?.Where(o => o.Type == type.ToString()).ToList();

                //track existing (to be deleted)
                if (itemsExistingByType != null && itemsExistingByType.Any())
                {
                    foreach (var item in itemsExistingByType)
                        item.File = await _blobService.Download(item.FileId);
                    itemsExisting.AddRange(itemsExistingByType);
                }

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
                        Type = type.ToString(),
                        ContentType = file.ContentType,
                        OriginalFileName = file.FileName,
                        DateCreated = DateTimeOffset.Now
                    };

                    //create new item in db
                    await _organizationDocumentRepository.Create(item);
                    itemsNew.Add(item);
                }

                //delete existing items in blob storage and db
                foreach (var item in itemsExisting)
                {
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
                    await _blobService.Create(item.FileId, item.File, FileType.Documents);

                //delete newly create items in blob storage
                foreach (var item in itemsNewBlobs)
                    await _blobService.Delete(item.Key);

                throw;
            }

            organization.Documents ??= new List<OrganizationDocument>();
            organization.Documents.AddRange(itemsNew);
            organization.Documents?.ForEach(o => o.Url = _blobService.GetURL(o.FileId));

            return (organization, itemsNewBlobs);
        }

        private string? GetBlobObjectURL(Guid? id)
        {
            if (!id.HasValue) return null;
            return _blobService.GetURL(id.Value);
        }
        #endregion
    }
}
