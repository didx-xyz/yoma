using FluentValidation;
using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Reward.Interfaces;

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
    private readonly IEducationService _educationService;
    private readonly IOrganizationService _organizationService;
    private readonly IMyOpportunityService _myOpportunityService;
    private readonly IWalletService _walletService;
    private readonly UserProfileRequestValidator _userProfileRequestValidator;
    private readonly IRepositoryValueContainsWithNavigation<User> _userRepository;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public UserProfileService(IHttpContextAccessor httpContextAccessor,
        IIdentityProviderClientFactory identityProviderClientFactory,
        IUserService userService,
        IGenderService genderService,
        ICountryService countryService,
        IEducationService educationService,
        IOrganizationService organizationService,
        IMyOpportunityService myOpportunityService,
        IWalletService walletService,
        UserProfileRequestValidator userProfileRequestValidator,
        IRepositoryValueContainsWithNavigation<User> userRepository,
        IExecutionStrategyService executionStrategyService)
    {
      _identityProviderClient = identityProviderClientFactory.CreateClient();
      _httpContextAccessor = httpContextAccessor;
      _userService = userService;
      _genderService = genderService;
      _countryService = countryService;
      _educationService = educationService;
      _organizationService = organizationService;
      _myOpportunityService = myOpportunityService;
      _walletService = walletService;
      _userProfileRequestValidator = userProfileRequestValidator;
      _userRepository = userRepository;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public UserProfile Get()
    {
      var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
      var user = _userService.GetByUsername(username, true, true);
      return ToProfile(user).Result;
    }

    public List<UserSkillInfo>? GetSkills()
    {
      var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
      var user = _userService.GetByUsername(username, true, true);
      return user.Skills;
    }

    public Settings GetSettings()
    {
      var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
      return SettingsHelper.FilterByRoles(_userService.GetSettingsByUsername(username), HttpContextAccessorHelper.GetRoles(_httpContextAccessor));
    }

    public async Task<UserProfile> UpsertPhoto(IFormFile file)
    {
      var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
      var user = await _userService.UpsertPhoto(username, file);
      return await ToProfile(user);
    }

    public async Task<UserProfile> UpdateSettings(SettingsRequest settings)
    {
      var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
      var user = await _userService.UpdateSettings(username, HttpContextAccessorHelper.GetRoles(_httpContextAccessor), settings);
      return await ToProfile(user);
    }

    public async Task<UserProfile> YoIDOnboard()
    {
      var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);
      var user = await _userService.YoIDOnboard(username);
      return await ToProfile(user);
    }

    public async Task<UserProfile> Update(UserRequestProfile request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _userProfileRequestValidator.ValidateAndThrowAsync(request);

      var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);

      var user = _userService.GetByUsername(username, true, true);

      if (!user.ExternalId.HasValue)
        throw new InvalidOperationException($"External id expected for user with id '{user.Id}'");
      var externalId = user.ExternalId.Value;

      var emailUpdated = !(string.Equals(user.Email ?? string.Empty, request.Email ?? string.Empty, StringComparison.InvariantCultureIgnoreCase));
      if (emailUpdated)
        //email address updates: pending ZLTO integration and ability to update wallet email address 
        throw new ValidationException("Email address updates are currently restricted. Please contact support for assistance");
      //if (_userService.GetByEmailOrNull(request.Email, false, false) != null)
      //throw new ValidationException($"{nameof(User)} with the specified email address '{request.Email}' already exists");

      //phone number updates: pending ZLTO integration and ability to update wallet phone number
      if (!string.IsNullOrEmpty(user.PhoneNumber) && request.UpdatePhoneNumber)
        throw new ValidationException("Phone number updates are currently restricted. Please contact support for assistance");

      user.Email = request.Email?.ToLower();
      if (emailUpdated) user.EmailConfirmed = false;
      user.FirstName = request.FirstName.TitleCase();
      user.Surname = request.Surname.TitleCase();
      user.DisplayName = request.DisplayName ?? string.Empty;
      user.SetDisplayName();
      user.CountryId = request.CountryId;
      user.EducationId = request.EducationId;
      user.GenderId = request.GenderId;
      user.DateOfBirth = request.DateOfBirth;

      if (string.IsNullOrEmpty(user.Email) && string.IsNullOrEmpty(user.PhoneNumber))
        throw new InvalidOperationException("Email or phone number is required");

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        user = await _userRepository.Update(user);

        username = user.Email ?? user.PhoneNumber;
        if (string.IsNullOrEmpty(username))
          throw new InvalidOperationException("Username is required");

        var userIdentityProvider = new IdentityProvider.Models.User
        {
          Id = externalId,
          FirstName = user.FirstName,
          LastName = user.Surname,
          Username = username,
          Email = user.Email,
          EmailVerified = user.EmailConfirmed ?? false,
          Gender = user.GenderId.HasValue ? _genderService.GetById(user.GenderId.Value).Name : null,
          Country = user.CountryId.HasValue ? _countryService.GetById(user.CountryId.Value).Name : null,
          Education = user.EducationId.HasValue ? _educationService.GetById(user.EducationId.Value).Name : null,
          DateOfBirth = user.DateOfBirth.HasValue ? user.DateOfBirth.Value.ToString("yyyy/MM/dd") : null
        };

        await _identityProviderClient.UpdateUser(userIdentityProvider, request.ResetPassword, emailUpdated, request.UpdatePhoneNumber);

        scope.Complete();
      });

      HttpContextAccessorHelper.UpdateUsername(_httpContextAccessor, username);

      return await ToProfile(user);
    }
    #endregion

    #region Private Members
    private async Task<UserProfile> ToProfile(User user)
    {
      var result = user.ToProfile();

      result.Settings = SettingsHelper.FilterByRoles(result.Settings, HttpContextAccessorHelper.GetRoles(_httpContextAccessor));

      var (status, balance) = await _walletService.GetWalletStatusAndBalance(result.Id);
      result.Zlto = new UserProfileZlto
      {
        Pending = balance.Pending,
        Available = balance.Available,
        Total = balance.Total,
        WalletCreationStatus = status,
        ZltoOffline = balance.ZltoOffline
      };

      result.AdminsOf = _organizationService.ListAdminsOf(true);

      var filter = new MyOpportunitySearchFilter
      {
        TotalCountOnly = true,
        Action = MyOpportunity.Action.Saved
      };
      result.OpportunityCountSaved = _myOpportunityService.Search(filter, user).TotalCount ?? default;

      filter.Action = MyOpportunity.Action.Verification;
      filter.VerificationStatuses = [VerificationStatus.Pending];
      result.OpportunityCountPending = _myOpportunityService.Search(filter, user).TotalCount ?? default;

      filter.VerificationStatuses = [VerificationStatus.Completed];
      result.OpportunityCountCompleted = _myOpportunityService.Search(filter, user).TotalCount ?? default;

      filter.VerificationStatuses = [VerificationStatus.Rejected];
      result.OpportunityCountRejected = _myOpportunityService.Search(filter, user).TotalCount ?? default;

      return result;
    }
    #endregion
  }
}
