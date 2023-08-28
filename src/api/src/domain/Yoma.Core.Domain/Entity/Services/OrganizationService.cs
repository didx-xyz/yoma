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
    //TODO: Background status changes
    public class OrganizationService : IOrganizationService
    {
        #region Class Variables
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserService _userService;
        private readonly IIdentityProviderClient _identityProviderClient;
        private readonly IOrganizationStatusService _organizationStatusService;
        private readonly IOrganizationProviderTypeService _providerTypeService;
        private readonly IBlobService _blobService;
        private readonly OrganizationCreateRequestValidator _organizationCreateRequestValidator;
        private readonly OrganizationUpdateRequestValidator _organizationUpdateRequestValidator;
        private readonly OrganizationSearchFilterValidator _organizationSearchFilterValidator;
        private readonly IRepositoryValueContainsWithNavigation<Organization> _organizationRepository;
        private readonly IRepository<OrganizationUser> _organizationUserRepository;
        private readonly IRepository<Models.OrganizationProviderType> _organizationProviderTypeRepository;
        private readonly IRepository<OrganizationDocument> _organizationDocumentRepository;

        public static readonly OrganizationStatus[] Statuses_Updatable = { OrganizationStatus.Active, OrganizationStatus.Inactive };
        private static readonly OrganizationStatus[] Statuses_Activatable = { OrganizationStatus.Inactive };
        private static readonly OrganizationStatus[] Statuses_Deletable = { OrganizationStatus.Active, OrganizationStatus.Inactive, OrganizationStatus.Declined };
        private static readonly OrganizationStatus[] Statuses_DeActivatable = { OrganizationStatus.Active, OrganizationStatus.Declined };
        private static readonly OrganizationStatus[] Statuses_Declinable = { OrganizationStatus.Inactive };
        #endregion

        #region Constructor
        public OrganizationService(IHttpContextAccessor httpContextAccessor,
            IUserService userService,
            IIdentityProviderClientFactory identityProviderClientFactory,
            IOrganizationStatusService organizationStatusService,
            IOrganizationProviderTypeService providerTypeService,
            IBlobService blobService,
            OrganizationCreateRequestValidator organizationCreateRequestValidator,
            OrganizationUpdateRequestValidator organizationUpdateRequestValidator,
            OrganizationSearchFilterValidator organizationSearchFilterValidator,
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
            _organizationRepository = organizationRepository;
            _organizationUserRepository = organizationUserRepository;
            _organizationProviderTypeRepository = organizationProviderTypeRepository;
            _organizationDocumentRepository = organizationDocumentRepository;
        }
        #endregion

        #region Public Members
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
            results.Items = query.ToList().Select(o => o.ToInfo()).ToList();

            return results;
        }

        public async Task<Organization> Create(OrganizationCreateRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _organizationCreateRequestValidator.ValidateAndThrowAsync(request);

            var existingByName = GetByNameOrNull(request.Name, false);
            if (existingByName != null)
                throw new ValidationException($"{nameof(Organization)} with the specified name '{request.Name}' already exists");

            var statusInactive = _organizationStatusService.GetByName(OrganizationStatus.Inactive.ToString());

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
                StatusId = statusInactive.Id, //new organization defaults to inactive / unapproved
                Status = OrganizationStatus.Inactive
            };

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            //create org
            result = await _organizationRepository.Create(result);

            //assign provider types
            result = await AssignProviderTypes(result, request.ProviderTypeIds);

            //insert logo
            result = await UpsertLogo(result, request.Logo);

            //assign admins
            if (request.AddCurrentUserAsAdmin)
            {
                var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
                await AssignAdmin(result, username);
            }

            if (request.AdminAdditionalEmails != null && request.AdminAdditionalEmails.Any())
                foreach (var item in request.AdminAdditionalEmails)
                    await AssignAdmin(result, item);

            //upload documents
            result = await UpsertDocuments(result, OrganizationDocumentType.Registration, request.RegistrationDocuments);

            var isProviderTypeEducation = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Education.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
            if (isProviderTypeEducation && (request.EducationProviderDocuments == null || !request.EducationProviderDocuments.Any()))
                throw new ValidationException($"Education provider type documents are required");

            if (request.EducationProviderDocuments != null && request.EducationProviderDocuments.Any())
                result = await UpsertDocuments(result, OrganizationDocumentType.EducationProvider, request.EducationProviderDocuments);

            var isProviderTypeMarketplace = result.ProviderTypes?.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Marketplace.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null;
            if (isProviderTypeMarketplace && (request.BusinessDocuments == null || !request.BusinessDocuments.Any()))
                throw new ValidationException($"Business documents are required");

            if (request.BusinessDocuments != null && request.BusinessDocuments.Any())
                result = await UpsertDocuments(result, OrganizationDocumentType.EducationProvider, request.BusinessDocuments);

            //TODO: Send email to SAP admins

            scope.Complete();

            return result;
        }

        public async Task<Organization> Update(OrganizationUpdateRequest request, bool ensureOrganizationAuthorization)
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
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{result.Status}')");

            await _organizationRepository.Update(result);
            result.DateModified = DateTimeOffset.Now;

            return result;
        }

        public async Task UpdateStatus(Guid id, OrganizationStatus status, bool ensureOrganizationAuthorization)
        {
            var org = GetById(id, false, ensureOrganizationAuthorization);

            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, !ensureOrganizationAuthorization);

            switch (status)
            {
                case OrganizationStatus.Active:
                    if (org.Status == OrganizationStatus.Active) return;
                    if (!Statuses_Activatable.Contains(org.Status))
                        throw new InvalidOperationException($"{nameof(Organization)} can not be activated (current status '{org.Status}')");
                    //TODO: Send email to org admins
                    break;

                case OrganizationStatus.Inactive:
                    if (org.Status == OrganizationStatus.Inactive) return;
                    if (!Statuses_DeActivatable.Contains(org.Status))
                        throw new InvalidOperationException($"{nameof(Organization)} can not be deactivated (current status '{org.Status}')");
                    //TODO: Send email to SAP admins
                    break;

                case OrganizationStatus.Declined:
                    if (org.Status == OrganizationStatus.Deleted) return;
                    if (!Statuses_Declinable.Contains(org.Status))
                        throw new InvalidOperationException($"{nameof(Organization)} can not be deleted (current status '{org.Status}')");
                    //TODO: Send email to org admins
                    break;

                case OrganizationStatus.Deleted:
                    if (org.Status == OrganizationStatus.Deleted) return;
                    if (!Statuses_Deletable.Contains(org.Status))
                        throw new InvalidOperationException($"{nameof(Organization)} can not be deleted (current status '{org.Status}')");
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(status), $"{nameof(Status)} of '{status}' not supported. Only statuses '{Status.Inactive} and {Status.Deleted} can be explicitly set");
            }

            var statusId = _organizationStatusService.GetByName(status.ToString()).Id;

            org.StatusId = statusId;
            org.Status = status;

            await _organizationRepository.Update(org);
        }

        public async Task<Organization> AssignProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, ensureOrganizationAuthorization);

            return await AssignProviderTypes(result, providerTypeIds);
        }

        public async Task<Organization> DeleteProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, ensureOrganizationAuthorization);

            if (providerTypeIds == null || !providerTypeIds.Any())
                throw new ArgumentNullException(nameof(providerTypeIds));

            if (!Statuses_Updatable.Contains(result.Status))
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{result.Status}')");

            foreach (var typeId in providerTypeIds)
            {
                var type = _providerTypeService.GetById(typeId);

                var item = _organizationProviderTypeRepository.Query().SingleOrDefault(o => o.OrganizationId == result.Id && o.ProviderTypeId == type.Id);
                if (item == null) continue;

                await _organizationProviderTypeRepository.Delete(item);

                var typeToRemove = (result.ProviderTypes?.Single(o => o.Id == type.Id))
                    ?? throw new InvalidOperationException($"Type '{type.Name}' expected but not found");
                result.ProviderTypes?.Remove(typeToRemove);
            }

            return result;
        }

        public async Task<Organization> UpsertLogo(Guid id, IFormFile? file, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, ensureOrganizationAuthorization);

            return await UpsertLogo(result, file);
        }

        public async Task<Organization> UpsertDocuments(Guid id, OrganizationDocumentType type, List<IFormFile> documents, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, ensureOrganizationAuthorization);

            return await UpsertDocuments(result, type, documents);
        }

        public async Task AssignAdmin(Guid id, string email, bool ensureOrganizationAuthorization)
        {
            var org = GetById(id, false, ensureOrganizationAuthorization);

            await AssignAdmin(org, email);
        }

        public async Task RemoveAdmin(Guid id, string email, bool ensureOrganizationAuthorization)
        {
            var org = GetById(id, false, ensureOrganizationAuthorization);

            var user = _userService.GetByEmail(email);
            if (!user.ExternalId.HasValue)
                throw new InvalidOperationException($"External id expected for user with id '{user.Id}'");

            if (!Statuses_Updatable.Contains(org.Status))
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{org.Status}')");

            var item = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == id && o.UserId == user.Id);
            if (item == null) return;

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            await _organizationUserRepository.Delete(item);

            await _identityProviderClient.RemoveRoles(user.ExternalId.Value, new List<string> { Constants.Role_OrganizationAdmin });

            scope.Complete();
        }

        public bool IsAdmin(Guid id, bool throwUnauthorized)
        {
            var org = GetById(id, false, false);
            return IsAdmin(org, throwUnauthorized);
        }

        public bool IsAdminsOf(List<Guid> ids, bool throwUnauthorized)
        {
            if (!ids.Any()) throw new ArgumentNullException(nameof(ids));

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false));
            var orgIds = _organizationUserRepository.Query().Where(o => o.UserId == user.Id).Select(o => o.OrganizationId).ToList();

            var result = !ids.Except(orgIds).Any();
            if (!result && throwUnauthorized)
                throw new SecurityException("Unauthorized");

            return result;
        }

        public List<UserInfo> ListAdmins(Guid id, bool ensureOrganizationAuthorization)
        {
            var org = GetById(id, false, ensureOrganizationAuthorization);
            var adminIds = _organizationUserRepository.Query().Where(o => o.OrganizationId == org.Id).Select(o => o.UserId).ToList();

            var results = new List<User>();
            adminIds.ForEach(o => results.Add(_userService.GetById(o)));
            return results.Select(o => o.ToInfo()).ToList();
        }

        public List<OrganizationInfo> ListAdminsOf()
        {
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false));
            var orgIds = _organizationUserRepository.Query().Where(o => o.UserId == user.Id).Select(o => o.OrganizationId).ToList();

            var results = _organizationRepository.Query().Where(o => orgIds.Contains(o.Id)).ToList();
            return results.Select(o => o.ToInfo()).ToList();
        }
        #endregion

        #region Private Members
        private bool IsAdmin(Organization org, bool throwUnauthorized)
        {
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false));

            OrganizationUser? orgUser = null;
            var isAdmin = HttpContextAccessorHelper.IsAdminRole(_httpContextAccessor);
            if (!isAdmin) orgUser = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == org.Id && o.UserId == user.Id);

            if (!isAdmin && orgUser == null && throwUnauthorized)
                throw new SecurityException("Unauthorized");
            return true;
        }

        private async Task<Organization> AssignProviderTypes(Organization org, List<Guid> providerTypeIds)
        {
            if (providerTypeIds == null || !providerTypeIds.Any())
                throw new ArgumentNullException(nameof(providerTypeIds));

            if (!Statuses_Updatable.Contains(org.Status))
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{org.Status}')");

            foreach (var typeId in providerTypeIds)
            {
                var type = _providerTypeService.GetById(typeId);

                var itemExisting = org.ProviderTypes?.SingleOrDefault(o => o.Id == type.Id);
                if (itemExisting != null) continue;

                var item = new Models.OrganizationProviderType
                {
                    OrganizationId = org.Id,
                    ProviderTypeId = type.Id
                };

                await _organizationProviderTypeRepository.Create(item);

                org.ProviderTypes ??= new List<Models.Lookups.OrganizationProviderType>();
                org.ProviderTypes.Add(new Models.Lookups.OrganizationProviderType { Id = type.Id, Name = type.Name });
            }

            return org;
        }

        private async Task<Organization> UpsertLogo(Organization org, IFormFile? file)
        {
            if (file == null)
                throw new ArgumentNullException(nameof(file));

            if (!Statuses_Updatable.Contains(org.Status))
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{org.Status}')");

            var currentLogo = org.LogoId.HasValue ? new { Id = org.LogoId.Value, File = await _blobService.Download(org.LogoId.Value) } : null;

            using (var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled))
            {
                BlobObject? blobObject = null;
                try
                {
                    blobObject = await _blobService.Create(file, FileType.Photos);
                    org.LogoId = blobObject.Id;
                    await _organizationRepository.Update(org);

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
            }

            org.LogoURL = GetBlobObjectURL(org.LogoId);

            return org;
        }

        private async Task AssignAdmin(Organization org, string email)
        {
            var user = _userService.GetByEmail(email);
            if (!user.ExternalId.HasValue)
                throw new InvalidOperationException($"External id expected for user with id '{user.Id}'");

            if (!Statuses_Updatable.Contains(org.Status))
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{org.Status}')");

            var item = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == org.Id && o.UserId == user.Id);
            if (item != null) return;

            item = new OrganizationUser
            {
                OrganizationId = org.Id,
                UserId = user.Id
            };

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            await _organizationUserRepository.Create(item);

            await _identityProviderClient.EnsureRoles(user.ExternalId.Value, new List<string> { Constants.Role_OrganizationAdmin });

            scope.Complete();
        }

        private async Task<Organization> UpsertDocuments(Organization org, OrganizationDocumentType type, List<IFormFile> documents)
        {
            if (documents == null || !documents.Any())
                throw new ArgumentNullException(nameof(documents));

            if (!Statuses_Updatable.Contains(org.Status))
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{org.Status}')");

            var itemsNew = new List<OrganizationDocument>();
            var itemsExisting = new List<OrganizationDocument>();
            var itemsExistingDeleted = new List<OrganizationDocument>();
            var itemsNewBlobs = new List<BlobObject>();
            try
            {
                using (var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled))
                {
                    var itemsExistingByType = org.Documents?.Where(o => o.Type == type.ToString()).ToList();

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
                            OrganizationId = org.Id,
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

            org.Documents = itemsNew;
            org.Documents?.ForEach(o => o.Url = _blobService.GetURL(o.FileId));

            return org;
        }

        private string? GetBlobObjectURL(Guid? id)
        {
            if (!id.HasValue) return null;
            return _blobService.GetURL(id.Value);
        }
        #endregion
    }
}
