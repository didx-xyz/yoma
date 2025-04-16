using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
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
    private readonly ILogger<UserProfileService> _logger;
    private readonly IIdentityProviderClient _identityProviderClient;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUserService _userService;
    private readonly IGenderService _genderService;
    private readonly ICountryService _countryService;
    private readonly IEducationService _educationService;
    private readonly IOrganizationService _organizationService;
    private readonly IMyOpportunityService _myOpportunityService;
    private readonly IWalletService _walletService;
    private readonly ISettingsDefinitionService _settingsDefinitionService;
    private readonly UserRequestCreateProfileValidator _userRequestCreateProfileValidator;
    private readonly UserRequestUpdateProfileValidator _userRequestUpdateProfileValidator;
    private readonly IRepositoryValueContainsWithNavigation<User> _userRepository;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public UserProfileService(ILogger<UserProfileService> logger,
      IHttpContextAccessor httpContextAccessor,
      IIdentityProviderClientFactory identityProviderClientFactory,
      IUserService userService,
      IGenderService genderService,
      ICountryService countryService,
      IEducationService educationService,
      IOrganizationService organizationService,
      IMyOpportunityService myOpportunityService,
      IWalletService walletService,
      ISettingsDefinitionService settingsDefinitionService,
      UserRequestCreateProfileValidator userRequestCreateProfileValidator,
      UserRequestUpdateProfileValidator userRequestUpdateProfileValidator,
      IRepositoryValueContainsWithNavigation<User> userRepository,
      IExecutionStrategyService executionStrategyService)
    {
      _logger = logger;
      _identityProviderClient = identityProviderClientFactory.CreateClient();
      _httpContextAccessor = httpContextAccessor;
      _userService = userService;
      _genderService = genderService;
      _countryService = countryService;
      _educationService = educationService;
      _organizationService = organizationService;
      _myOpportunityService = myOpportunityService;
      _walletService = walletService;
      _settingsDefinitionService = settingsDefinitionService;
      _userRequestCreateProfileValidator = userRequestCreateProfileValidator;
      _userRequestUpdateProfileValidator = userRequestUpdateProfileValidator;
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

    public async Task<UserProfile> Create(UserRequestCreateProfile request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      request.PhoneNumber = request.PhoneNumber?.NormalizePhoneNumber(true) ?? string.Empty;

      //either 'Phone Number' or 'Email' is required
      await _userRequestCreateProfileValidator.ValidateAndThrowAsync(request);

      var existingByEmail = _userService.GetByEmailOrNull(request.Email, false, false);
      if (existingByEmail != null)
        throw new ValidationException($"{nameof(User)} with the specified email address '{request.Email}' already exists");

      var existingByPhone = _userService.GetByPhoneOrNull(request.PhoneNumber, false, false);
      if (existingByPhone != null)
        throw new ValidationException($"{nameof(User)} with the specified phone number '{request.PhoneNumber}' already exists");

      var countryId = string.IsNullOrEmpty(request.CountryCodeAlpha2) ? (Guid?)null : _countryService.GetByCodeAplha2(request.CountryCodeAlpha2).Id;

      //neither email or phone number is flagged as confirmed; both will be confirmed by keycloak and flagged as such on 1st login
      var result = new User
      {
        Username = request.Email ?? request.PhoneNumber,
        Email = request.Email?.ToLower(),
        FirstName = request.FirstName.TitleCase(),
        Surname = request.Surname.TitleCase(),
        DisplayName = request.DisplayName,
        PhoneNumber = request.PhoneNumber,
        CountryId = countryId,
        EducationId = request.EducationId,
        GenderId = request.GenderId,
        DateOfBirth = request.DateOfBirth.RemoveTime(),
        Settings = SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.User), (string?)null)
      };
      result.SetDisplayName();

      try
      {
        var requestIdentityProvider = new IdentityProvider.Models.UserRequestCreate
        {
          Username = result.Username,
          Email = result.Email,
          FirstName = result.FirstName,
          LastName = result.Surname,
          PhoneNumber = result.PhoneNumber,
          Gender = result.GenderId.HasValue ? _genderService.GetById(result.GenderId.Value).Name : null,
          Country = result.CountryId.HasValue ? _countryService.GetById(result.CountryId.Value).Name : null,
          Education = result.EducationId.HasValue ? _educationService.GetById(result.EducationId.Value).Name : null,
          DateOfBirth = result.DateOfBirth.HasValue ? result.DateOfBirth.Value.ToString("yyyy/MM/dd") : null,
        };

        var userKeycloak = await _identityProviderClient.CreateUser(requestIdentityProvider);
        result.ExternalId = userKeycloak.Id;

        result = await _userRepository.Create(result);

        //YoIDOnboard actioned after 1st login
      }
      catch
      {
        //rollback user createtion in keycloak
        if (result.ExternalId.HasValue)
          try
          {
            await _identityProviderClient.DeleteUser(result.ExternalId.Value);
          }
          catch (Exception ex)
          {
            _logger.LogWarning(ex, "Failed to roll back creation of Keycloak user '{username}'", result.Username);
          }

        throw;
      }

      return await ToProfile(result, true);
    }

    public async Task<UserProfile> Update(UserRequestUpdateProfile request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _userRequestUpdateProfileValidator.ValidateAndThrowAsync(request);

      var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);

      var result = _userService.GetByUsername(username, true, true);

      if (!result.ExternalId.HasValue)
        throw new InvalidOperationException($"External id expected for user with id '{result.Id}'");
      var externalId = result.ExternalId.Value;

      if (!string.IsNullOrEmpty(result.Email) && string.IsNullOrEmpty(request.Email))
        throw new ValidationException("An email address is already set and cannot be removed. Please provide a valid email.");

      var emailUpdated = !(string.Equals(result.Email ?? string.Empty, request.Email ?? string.Empty, StringComparison.InvariantCultureIgnoreCase));
      if (emailUpdated)
      {
        if (_userService.GetByEmailOrNull(request.Email, false, false) != null)
          throw new ValidationException($"{nameof(User)} with the specified email address '{request.Email}' already exists");
      }

      result.Email = request.Email?.ToLower();
      if (emailUpdated) result.EmailConfirmed = false;
      result.FirstName = request.FirstName.TitleCase();
      result.Surname = request.Surname.TitleCase();
      result.DisplayName = request.DisplayName;
      result.SetDisplayName();
      result.CountryId = request.CountryId;
      result.EducationId = request.EducationId;
      result.GenderId = request.GenderId;
      result.DateOfBirth = request.DateOfBirth?.RemoveTime();

      //failsafe
      if (string.IsNullOrEmpty(result.Email) && string.IsNullOrEmpty(result.PhoneNumber))
        throw new InvalidOperationException("Email or phone number is required");

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await _userRepository.Update(result);

        username = result.Email ?? result.PhoneNumber;
        if (string.IsNullOrEmpty(username))
          throw new InvalidOperationException("Username is required");

        var requestIdentityProvider = new IdentityProvider.Models.UserRequestUpdate
        {
          Id = externalId,
          Username = username,
          Email = result.Email,
          FirstName = result.FirstName,
          LastName = result.Surname,
          PhoneNumber = result.PhoneNumber,
          Gender = result.GenderId.HasValue ? _genderService.GetById(result.GenderId.Value).Name : null,
          Country = result.CountryId.HasValue ? _countryService.GetById(result.CountryId.Value).Name : null,
          Education = result.EducationId.HasValue ? _educationService.GetById(result.EducationId.Value).Name : null,
          DateOfBirth = result.DateOfBirth.HasValue ? result.DateOfBirth.Value.ToString("yyyy/MM/dd") : null,
          EmailVerified = result.EmailConfirmed,
          PhoneNumberVerified = result.PhoneNumberConfirmed,
          ResetPassword = request.ResetPassword,
          VerifyEmail = emailUpdated,
          UpdatePhoneNumber = request.UpdatePhoneNumber
        };

        await _identityProviderClient.UpdateUser(requestIdentityProvider);

        scope.Complete();
      });

      HttpContextAccessorHelper.UpdateUsername(_httpContextAccessor, username);

      return await ToProfile(result);
    }
    #endregion

    #region Private Members
    private async Task<UserProfile> ToProfile(User user, bool isOnBehalfOfUser = false)
    {
      var result = user.ToProfile();

      var roles = isOnBehalfOfUser
        ? [Constants.Role_User]
        : HttpContextAccessorHelper.GetRoles(_httpContextAccessor);

      result.Settings = SettingsHelper.FilterByRoles(result.Settings, roles);

      var (status, balance) = await _walletService.GetWalletStatusAndBalance(result.Id);
      result.Zlto = new UserProfileZlto
      {
        Pending = balance.Pending,
        Available = balance.Available,
        Total = balance.Total,
        WalletCreationStatus = status,
        ZltoOffline = balance.ZltoOffline
      };

      result.AdminsOf = isOnBehalfOfUser ? [] : _organizationService.ListAdminsOf(true);

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
