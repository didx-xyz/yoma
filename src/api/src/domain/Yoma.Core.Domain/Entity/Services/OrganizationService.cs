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
        private readonly OrganizationRequestValidator _organizationRequestValidator;
        private readonly OrganizationSearchFilterValidator _organizationSearchFilterValidator;
        private readonly IRepositoryValueContainsWithNavigation<Organization> _organizationRepository;
        private readonly IRepository<OrganizationUser> _organizationUserRepository;
        private readonly IRepository<OrganizationProviderType> _organizationProviderTypeRepository;

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
            OrganizationRequestValidator organizationRequestValidator,
            OrganizationSearchFilterValidator organizationSearchFilterValidator,
            IRepositoryValueContainsWithNavigation<Organization> organizationRepository,
            IRepository<OrganizationUser> organizationUserRepository,
            IRepository<OrganizationProviderType> organizationProviderTypeRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _identityProviderClient = identityProviderClientFactory.CreateClient();
            _organizationStatusService = organizationStatusService;
            _providerTypeService = providerTypeService;
            _blobService = blobService;
            _organizationRequestValidator = organizationRequestValidator;
            _organizationSearchFilterValidator = organizationSearchFilterValidator;
            _organizationRepository = organizationRepository;
            _organizationUserRepository = organizationUserRepository;
            _organizationProviderTypeRepository = organizationProviderTypeRepository;
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
                IsAdmin(result.Id, true);

            return result;
        }

        public Organization? GetByIdOrNull(Guid id, bool includeChildItems)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            var result = _organizationRepository.Query(includeChildItems).SingleOrDefault(o => o.Id == id);
            if (result == null) return null;

            result.LogoURL = GetS3ObjectURL(result.LogoId);
            result.CompanyRegistrationDocumentURL = GetS3ObjectURL(result.CompanyRegistrationDocumentId);

            return result;
        }

        public Organization? GetByNameOrNull(string name, bool includeChildItems)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            var result = _organizationRepository.Query(includeChildItems).SingleOrDefault(o => o.Name == name);
            if (result == null) return null;

            result.LogoURL = GetS3ObjectURL(result.LogoId);
            result.CompanyRegistrationDocumentURL = GetS3ObjectURL(result.CompanyRegistrationDocumentId);

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

        public async Task<Organization> Upsert(OrganizationRequest request, bool ensureOrganizationAuthorization)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _organizationRequestValidator.ValidateAndThrowAsync(request);

            // check if user exists
            var isNew = !request.Id.HasValue;
            var isUserOnly = HttpContextAccessorHelper.IsUserRoleOnly(_httpContextAccessor);

            var result = !request.Id.HasValue ? new Organization { Id = Guid.NewGuid() } : GetById(request.Id.Value, true, ensureOrganizationAuthorization);

            if (!isNew && isUserOnly)
                throw new SecurityException("Unauthorized: Updates are not permitted for an authenticated user who solely holds the 'User' role");

            var existingByEmail = GetByNameOrNull(request.Name, false);
            if (existingByEmail != null && (isNew || result.Id != existingByEmail.Id))
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

            if (isNew)
            {
                var statusInactive = _organizationStatusService.GetByName(OrganizationStatus.Inactive.ToString());
                result.StatusId = statusInactive.Id; //new organization defaults to inactive / unapproved
                //TODO: Send email to SAP admins

                using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
                result = await _organizationRepository.Create(result);
                if (isUserOnly)
                {
                    var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false));
                    await AssignAdmin(result.Id, user.Id, false);
                }
                scope.Complete();
            }
            else
            {
                if (!Statuses_Updatable.Contains(result.Status))
                    throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{result.Status}')");

                await _organizationRepository.Update(result);
                result.DateModified = DateTimeOffset.Now;
            }

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

        public async Task AssignProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization)
        {
            var org = GetById(id, false, ensureOrganizationAuthorization);

            if (providerTypeIds == null || !providerTypeIds.Any())
                throw new ArgumentNullException(nameof(providerTypeIds));

            if (!Statuses_Updatable.Contains(org.Status))
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{org.Status}')");

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var typeId in providerTypeIds)
            {
                var type = _providerTypeService.GetById(typeId);

                var item = _organizationProviderTypeRepository.Query().SingleOrDefault(o => o.OrganizationId == org.Id && o.ProviderTypeId == type.Id);
                if (item != null) return;

                item = new OrganizationProviderType
                {
                    OrganizationId = org.Id,
                    ProviderTypeId = type.Id
                };

                await _organizationProviderTypeRepository.Create(item);
            }

            scope.Complete();
        }

        public async Task DeleteProviderTypes(Guid id, List<Guid> providerTypeIds, bool ensureOrganizationAuthorization)
        {
            var org = GetById(id, false, ensureOrganizationAuthorization);

            if (providerTypeIds == null || !providerTypeIds.Any())
                throw new ArgumentNullException(nameof(providerTypeIds));

            if (!Statuses_Updatable.Contains(org.Status))
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{org.Status}')");

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var typeId in providerTypeIds)
            {
                var type = _providerTypeService.GetById(typeId);

                var item = _organizationProviderTypeRepository.Query().SingleOrDefault(o => o.OrganizationId == org.Id && o.ProviderTypeId == type.Id);
                if (item == null) return;

                await _organizationProviderTypeRepository.Delete(item);
            }
        }

        public async Task<Organization> UpsertLogo(Guid id, IFormFile? file, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, ensureOrganizationAuthorization);

            if (file == null)
                throw new ArgumentNullException(nameof(file));

            if (!Statuses_Updatable.Contains(result.Status))
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{result.Status}')");

            var currentLogoId = result.LogoId;

            using (var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled))
            {
                BlobObject? s3Object = null;
                try
                {
                    s3Object = await _blobService.Create(file, FileTypeEnum.Photos);
                    result.LogoId = s3Object.Id;
                    await _organizationRepository.Update(result);

                    if (currentLogoId.HasValue)
                        await _blobService.Delete(currentLogoId.Value);

                    scope.Complete();
                }
                catch
                {
                    if (s3Object != null)
                        await _blobService.Delete(s3Object.Id);

                    throw;
                }
            }

            result.LogoURL = GetS3ObjectURL(result.LogoId);

            return result;
        }

        public async Task<Organization> UpsertRegistrationDocument(Guid id, IFormFile? file, bool ensureOrganizationAuthorization)
        {
            var result = GetById(id, true, ensureOrganizationAuthorization);

            if (file == null)
                throw new ArgumentNullException(nameof(file));

            if (!Statuses_Updatable.Contains(result.Status))
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{result.Status}')");

            var currentDocumentId = result.CompanyRegistrationDocumentId;

            using (var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled))
            {
                BlobObject? s3Object = null;
                try
                {
                    s3Object = await _blobService.Create(file, FileTypeEnum.Documents);
                    result.CompanyRegistrationDocumentId = s3Object.Id;
                    await _organizationRepository.Update(result);

                    if (currentDocumentId.HasValue)
                        await _blobService.Delete(currentDocumentId.Value);

                    scope.Complete();
                }
                catch
                {
                    if (s3Object != null)
                        await _blobService.Delete(s3Object.Id);

                    throw;
                }
            }

            result.CompanyRegistrationDocumentURL = GetS3ObjectURL(result.CompanyRegistrationDocumentId);

            return result;
        }

        public async Task AssignAdmin(Guid id, Guid userId, bool ensureOrganizationAuthorization)
        {
            var org = GetById(id, false, ensureOrganizationAuthorization);
            var user = _userService.GetById(userId);
            if (!user.ExternalId.HasValue)
                throw new InvalidOperationException($"External id expected for user with id '{user.Id}'");

            if (!Statuses_Updatable.Contains(org.Status))
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{org.Status}')");

            var item = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == id && o.UserId == userId);
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

        public async Task RemoveAdmin(Guid id, Guid userId, bool ensureOrganizationAuthorization)
        {
            var org = GetById(id, false, ensureOrganizationAuthorization);

            var user = _userService.GetById(userId);
            if (!user.ExternalId.HasValue)
                throw new InvalidOperationException($"External id expected for user with id '{user.Id}'");

            if (!Statuses_Updatable.Contains(org.Status))
                throw new InvalidOperationException($"{nameof(Organization)} can no longer be updated (current status '{org.Status}')");

            var item = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == id && o.UserId == userId);
            if (item == null) return;

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
            await _organizationUserRepository.Delete(item);

            await _identityProviderClient.RemoveRoles(user.ExternalId.Value, new List<string> { Constants.Role_OrganizationAdmin });

            scope.Complete();
        }

        public bool IsAdmin(Guid id, bool throwUnauthorized)
        {
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false));
            var org = GetById(id, false, false);

            var result = _organizationUserRepository.Query().SingleOrDefault(o => o.OrganizationId == org.Id && o.UserId == user.Id) != null;
            if (!result && throwUnauthorized)
                throw new SecurityException("Unauthorized");
            return result;
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

        public List<User> ListAdmins(Guid id, bool ensureOrganizationAuthorization)
        {
            var org = GetById(id, false, ensureOrganizationAuthorization);
            var adminIds = _organizationUserRepository.Query().Where(o => o.OrganizationId == org.Id).Select(o => o.UserId).ToList();

            var results = new List<User>();
            adminIds.ForEach(o => results.Add(_userService.GetById(o)));
            return results;
        }

        public List<Organization> ListAdminsOf()
        {
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false));
            var orgIds = _organizationUserRepository.Query().Where(o => o.UserId == user.Id).Select(o => o.OrganizationId).ToList();

            var results = _organizationRepository.Query().Where(o => orgIds.Contains(o.Id)).ToList();
            return results;
        }
        #endregion

        #region Private Members
        private string? GetS3ObjectURL(Guid? id)
        {
            if (!id.HasValue) return null;
            return _blobService.GetURL(id.Value);
        }
        #endregion
    }
}
