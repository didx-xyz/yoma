using FluentValidation;
using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.Entity.Services
{
    public class UserProfileService : IUserProfileService
    {
        #region Class Variables
        private readonly IIdentityProviderClient _identityProviderClient;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserService _userService;
        private readonly IGenderService _genderService;
        private readonly ICountryService _countryService;
        private readonly IOrganizationService _organizationService;
        private readonly IMyOpportunityService _myOpportunityService;
        private readonly UserProfileRequestValidator _userProfileRequestValidator;
        private readonly IRepositoryValueContainsWithNavigation<User> _userRepository;
        #endregion

        #region Constructor
        public UserProfileService(IHttpContextAccessor httpContextAccessor,
            IIdentityProviderClientFactory identityProviderClientFactory,
            IUserService userService,
            IGenderService genderService,
            ICountryService countryService,
            IOrganizationService organizationService,
            IMyOpportunityService myOpportunityService,
            UserProfileRequestValidator userProfileRequestValidator,
            IRepositoryValueContainsWithNavigation<User> userRepository)
        {
            _identityProviderClient = identityProviderClientFactory.CreateClient();
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _genderService = genderService;
            _countryService = countryService;
            _organizationService = organizationService;
            _myOpportunityService = myOpportunityService;
            _userProfileRequestValidator = userProfileRequestValidator;
            _userRepository = userRepository;
        }
        #endregion

        #region Public Members
        public UserProfile Get()
        {
            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
            var user = _userService.GetByEmail(username, true, true);
            return ToProfile(user);
        }

        public async Task<UserProfile> UpsertPhoto(IFormFile file)
        {
            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
            var user = await _userService.UpsertPhoto(username, file);
            return ToProfile(user);
        }

        public async Task<UserProfile> YoIDOnboard()
        {
            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
            var user = await _userService.YoIDOnboard(username);
            return ToProfile(user);
        }

        public async Task<UserProfile> Update(UserRequestProfile request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _userProfileRequestValidator.ValidateAndThrowAsync(request);

            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);

            var user = _userService.GetByEmail(username, true, true);

            if (!user.ExternalId.HasValue)
                throw new InvalidOperationException($"External id expected for user with id '{user.Id}'");
            var externalId = user.ExternalId.Value;

            var emailUpdated = !string.Equals(user.Email, request.Email, StringComparison.CurrentCultureIgnoreCase);
            if (emailUpdated)
                if (_userService.GetByEmailOrNull(request.Email, false, false) != null)
                    throw new ValidationException($"{nameof(User)} with the specified email address '{request.Email}' already exists");

            user.Email = request.Email;
            if (emailUpdated) user.EmailConfirmed = false;
            user.FirstName = request.FirstName;
            user.Surname = request.Surname;
            user.DisplayName = request.DisplayName ?? string.Empty;
            user.SetDisplayName();
            user.PhoneNumber = request.PhoneNumber;
            user.CountryId = request.CountryId;
            user.CountryOfResidenceId = request.CountryOfResidenceId;
            user.GenderId = request.GenderId;
            user.DateOfBirth = request.DateOfBirth;

            using (var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled))
            {
                user = await _userRepository.Update(user);

                var userIdentityProvider = new IdentityProvider.Models.User
                {
                    Id = externalId,
                    FirstName = user.FirstName,
                    LastName = user.Surname,
                    Username = user.Email,
                    Email = user.Email,
                    EmailVerified = user.EmailConfirmed,
                    PhoneNumber = user.PhoneNumber,
                    Gender = user.GenderId.HasValue ? _genderService.GetById(user.GenderId.Value).Name : null,
                    CountryOfOrigin = user.CountryId.HasValue ? _countryService.GetById(user.CountryId.Value).Name : null,
                    CountryOfResidence = user.CountryOfResidenceId.HasValue ? _countryService.GetById(user.CountryOfResidenceId.Value).Name : null,
                    DateOfBirth = user.DateOfBirth.HasValue ? user.DateOfBirth.Value.ToString("yyyy/MM/dd") : null
                };

                await _identityProviderClient.UpdateUser(userIdentityProvider, request.ResetPassword);

                scope.Complete();
            }

            return ToProfile(user);
        }
        #endregion

        #region Private Members
        private UserProfile ToProfile(User user)
        {
            var result = user.ToProfile();
            result.AdminsOf = _organizationService.ListAdminsOf(true);

            var filter = new MyOpportunitySearchFilter
            {
                TotalCountOnly = true,
                Action = MyOpportunity.Action.Saved
            };
            result.OpportunityCountSaved = _myOpportunityService.Search(filter).TotalCount ?? default;

            filter.Action = MyOpportunity.Action.Verification;
            filter.VerificationStatus = MyOpportunity.VerificationStatus.Pending;
            result.OpportunityCountPending = _myOpportunityService.Search(filter).TotalCount ?? default;

            filter.VerificationStatus = MyOpportunity.VerificationStatus.Completed;
            result.OpportunityCountCompleted = _myOpportunityService.Search(filter).TotalCount ?? default;

            return result;
        }
        #endregion
    }
}
