using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Entity.Validators;
using FluentValidation;
using System.Transactions;
using Microsoft.AspNetCore.Http;
using User = Yoma.Core.Domain.Entity.Models.User;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.Entity.Services
{
    public class UserService : IUserService
    {
        #region Class Variables
        private readonly IIdentityProviderClient _identityProviderClient;
        private readonly IBlobService _blobService;
        private readonly IGenderService _genderService;
        private readonly ICountryService _countryService;
        private readonly UserRequestValidator _userValidator;
        private readonly UserProfileRequestValidator _userProfileRequestValidator;
        private readonly UserSearchFilterValidator _userSearchFilterValidator;
        private readonly IRepositoryValueContainsWithNavigation<User> _userRepository;
        #endregion

        #region Constructor
        public UserService(
            IIdentityProviderClientFactory identityProviderClientFactory,
            IBlobService blobService,
            IGenderService genderService,
            ICountryService countryService,
            UserRequestValidator userValidator,
            UserProfileRequestValidator userProfileRequestValidator,
            UserSearchFilterValidator userSearchFilterValidator,
            IRepositoryValueContainsWithNavigation<User> userRepository)
        {
            _identityProviderClient = identityProviderClientFactory.CreateClient();
            _blobService = blobService;
            _genderService = genderService;
            _countryService = countryService;
            _userValidator = userValidator;
            _userProfileRequestValidator = userProfileRequestValidator;
            _userSearchFilterValidator = userSearchFilterValidator;
            _userRepository = userRepository;
        }
        #endregion

        #region Public Members
        public User GetByEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentNullException(nameof(email));

            var result = GetByEmailOrNull(email)
                ?? throw new ValidationException($"User with email '{email}' does not exist");

            return result;
        }

        public User? GetByEmailOrNull(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentNullException(nameof(email));
            email = email.Trim();

            var result = _userRepository.Query(false).SingleOrDefault(o => o.Email == email);
            if (result == null) return null;

            result.PhotoURL = GetBlobObjectURL(result.PhotoId);

            return result;
        }

        public User GetById(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            var result = _userRepository.Query(false).SingleOrDefault(o => o.Id == id)
                ?? throw new ArgumentOutOfRangeException(nameof(id), $"{nameof(User)} with id '{id}' does not exist");

            result.PhotoURL = GetBlobObjectURL(result.PhotoId);

            return result;
        }

        public UserSearchResults Search(UserSearchFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            _userSearchFilterValidator.ValidateAndThrow(filter);

            var query = _userRepository.Query();

            //only includes users which email has been confirmed (implies linked to identity provider)
            query = query.Where(o => o.EmailConfirmed);

            if (!string.IsNullOrEmpty(filter.ValueContains))
                query = _userRepository.Contains(query, filter.ValueContains);

            var results = new UserSearchResults();
            query = query.OrderBy(o => o.DisplayName);

            if (filter.PaginationEnabled)
            {
                results.TotalCount = query.Count();
                query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
            }
            results.Items = query.ToList().Select(o => o.ToInfo()).ToList();

            return results;
        }

        public async Task<User> UpdateProfile(string? email, UserProfileRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _userProfileRequestValidator.ValidateAndThrowAsync(request);

            if (string.IsNullOrEmpty(request.PhoneNumber)) request.PhoneNumber = null;

            var result = GetByEmail(email);

            if (!result.ExternalId.HasValue)
                throw new InvalidOperationException($"External id expected for user with id '{result.Id}'");

            var emailUpdated = !string.Equals(result.Email, request.Email, StringComparison.CurrentCultureIgnoreCase);
            if (emailUpdated)
                if (GetByEmailOrNull(request.Email) != null)
                    throw new ValidationException($"{nameof(User)} with the specified email address '{request.Email}' already exists");

            result.Email = request.Email;
            if (emailUpdated) result.EmailConfirmed = false;
            result.FirstName = request.FirstName;
            result.Surname = request.Surname;
            result.DisplayName = request.DisplayName;
            result.SetDisplayName();
            result.PhoneNumber = request.PhoneNumber;
            result.CountryId = request.CountryId;
            result.CountryOfResidenceId = request.CountryOfResidenceId;
            result.GenderId = request.GenderId;
            result.DateOfBirth = request.DateOfBirth;

            using (var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled))
            {
                await _userRepository.Update(result);
                result.DateModified = DateTimeOffset.Now;

                var user = new IdentityProvider.Models.User
                {
                    Id = result.ExternalId.Value,
                    FirstName = result.FirstName,
                    LastName = result.Surname,
                    Username = result.Email,
                    Email = result.Email,
                    EmailVerified = result.EmailConfirmed,
                    PhoneNumber = result.PhoneNumber,
                    Gender = result.GenderId.HasValue ? _genderService.GetById(result.GenderId.Value).Name : null,
                    CountryOfOrigin = result.CountryId.HasValue ? _countryService.GetById(result.CountryId.Value).Name : null,
                    CountryOfResidence = result.CountryOfResidenceId.HasValue ? _countryService.GetById(result.CountryOfResidenceId.Value).Name : null,
                    DateOfBirth = result.DateOfBirth.HasValue ? result.DateOfBirth.Value.ToString("yyyy/MM/dd") : null
                };

                await _identityProviderClient.UpdateUser(user, request.ResetPassword);

                scope.Complete();
            }

            return result;
        }

        public async Task<User> Upsert(UserRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _userValidator.ValidateAndThrowAsync(request);

            // check if user exists
            var isNew = !request.Id.HasValue;
            var result = !request.Id.HasValue ? new User { Id = Guid.NewGuid() } : GetById(request.Id.Value);

            var existingByEmail = GetByEmailOrNull(request.Email);
            if (existingByEmail != null && (isNew || result.Id != existingByEmail.Id))
                throw new ValidationException($"{nameof(User)} with the specified email address '{request.Email}' already exists");

            //profile fields updatable via UpdateProfile; Identity provider is source of truth
            if (isNew)
            {
                var kcUser = await _identityProviderClient.GetUser(result.Email) ?? throw new InvalidOperationException($"{nameof(User)} with email '{result.Email}' does not exist");
                result.Email = request.Email;
                result.FirstName = request.FirstName;
                result.Surname = request.Surname;
                result.DisplayName = request.DisplayName;
                result.SetDisplayName();
                result.PhoneNumber = request.PhoneNumber;
                result.CountryId = request.CountryId;
                result.CountryOfResidenceId = request.CountryOfResidenceId;
                result.GenderId = request.GenderId;
                result.DateOfBirth = request.DateOfBirth.RemoveTime();
            }

            result.EmailConfirmed = request.EmailConfirmed;
            result.DateLastLogin = request.DateLastLogin;
            result.ExternalId = request.ExternalId;
            result.ZltoWalletId = request.ZltoWalletId;
            result.ZltoWalletCountryId = request.ZltoWalletCountryId;
            result.TenantId = request.TenantId;

            if (isNew)
                result = await _userRepository.Create(result);
            else
            {
                await _userRepository.Update(result);
                result.DateModified = DateTimeOffset.Now;
            }

            return result;
        }

        public async Task<User> UpsertPhoto(string? email, IFormFile? file)
        {
            var result = GetByEmail(email);

            if (file == null)
                throw new ArgumentNullException(nameof(file));

            var currentPhoto = result.PhotoId.HasValue ? new { Id = result.PhotoId.Value, File = await _blobService.Download(result.PhotoId.Value) } : null;

            using (var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled))
            {
                BlobObject? blobObject = null;
                try
                {
                    blobObject = await _blobService.Create(file, FileType.Photos);
                    result.PhotoId = blobObject.Id;
                    await _userRepository.Update(result);

                    if (currentPhoto != null)
                        await _blobService.Delete(currentPhoto.Id);

                    scope.Complete();
                }
                catch
                {
                    //roll back
                    if (blobObject != null)
                        await _blobService.Delete(blobObject.Key);

                    if (currentPhoto != null)
                        await _blobService.Create(currentPhoto.Id, currentPhoto.File, FileType.Photos);

                    throw;
                }
            }

            result.PhotoURL = GetBlobObjectURL(result.PhotoId);

            return result;
        }
        #endregion

        #region Private Members
        private string? GetBlobObjectURL(Guid? id)
        {
            if (!id.HasValue) return null;
            return _blobService.GetURL(id.Value);
        }
        #endregion
    }
}
