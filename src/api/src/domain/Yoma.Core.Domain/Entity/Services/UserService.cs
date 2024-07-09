using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Transactions;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;

namespace Yoma.Core.Domain.Entity.Services
{
  public class UserService : IUserService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IIdentityProviderClient _identityProviderClient;
    private readonly IBlobService _blobService;
    private readonly IGenderService _genderService;
    private readonly ICountryService _countryService;
    private readonly ISkillService _skillService;
    private readonly ISSITenantService _ssiTenantService;
    private readonly ISSICredentialService _ssiCredentialService;
    private readonly ISettingsDefinitionService _settingsDefinitionService;
    private readonly UserRequestValidator _userRequestValidator;
    private readonly UserSearchFilterValidator _userSearchFilterValidator;
    private readonly UserRequestSettingsValidator _userRequestSettingsValidator;
    private readonly IRepositoryValueContainsWithNavigation<User> _userRepository;
    private readonly IRepository<UserSkill> _userSkillRepository;
    private readonly IRepository<UserSkillOrganization> _userSkillOrganizationRepository;
    private readonly IRepository<UserLoginHistory> _userLoginHistoryRepository;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public UserService(
        IOptions<AppSettings> appSettings,
        IIdentityProviderClientFactory identityProviderClientFactory,
        IBlobService blobService,
        IGenderService genderService,
        ICountryService countryService,
        ISkillService skillService,
        ISSITenantService ssiTenantService,
        ISSICredentialService ssiCredentialService,
        ISettingsDefinitionService settingsDefinitionService,
        UserRequestValidator userValidator,
        UserSearchFilterValidator userSearchFilterValidator,
        UserRequestSettingsValidator userRequestSettingsValidator,
        IRepositoryValueContainsWithNavigation<User> userRepository,
        IRepository<UserSkill> userSkillRepository,
        IRepository<UserSkillOrganization> userSkillOrganizationRepository,
        IRepository<UserLoginHistory> userLoginHistoryRepository,
        IExecutionStrategyService executionStrategyService)
    {
      _appSettings = appSettings.Value;
      _identityProviderClient = identityProviderClientFactory.CreateClient();
      _blobService = blobService;
      _genderService = genderService;
      _countryService = countryService;
      _skillService = skillService;
      _ssiTenantService = ssiTenantService;
      _ssiCredentialService = ssiCredentialService;
      _settingsDefinitionService = settingsDefinitionService;
      _userRequestValidator = userValidator;
      _userSearchFilterValidator = userSearchFilterValidator;
      _userRequestSettingsValidator = userRequestSettingsValidator;
      _userRepository = userRepository;
      _userSkillRepository = userSkillRepository;
      _userSkillOrganizationRepository = userSkillOrganizationRepository;
      _userLoginHistoryRepository = userLoginHistoryRepository;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public User GetByEmail(string? email, bool includeChildItems, bool includeComputed)
    {
      if (string.IsNullOrWhiteSpace(email))
        throw new ArgumentNullException(nameof(email));

      var result = GetByEmailOrNull(email, includeChildItems, includeComputed)
          ?? throw new EntityNotFoundException($"User with email '{email}' does not exist");

      return result;
    }

    public User? GetByEmailOrNull(string email, bool includeChildItems, bool includeComputed)
    {
      if (string.IsNullOrWhiteSpace(email))
        throw new ArgumentNullException(nameof(email));
      email = email.Trim();

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      var result = _userRepository.Query(includeChildItems).SingleOrDefault(o => o.Email.ToLower() == email.ToLower());
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      if (result == null) return null;

      if (includeComputed)
      {
        result.PhotoURL = GetBlobObjectURL(result.PhotoStorageType, result.PhotoKey);
        result.Skills?.ForEach(o => o.Organizations?.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoStorageType, o.LogoKey)));
        result.Settings = SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.User), result.SettingsRaw);
      }

      return result;
    }

    public User GetById(Guid id, bool includeChildItems, bool includeComputed)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = GetByIdOrNull(id, includeChildItems, includeComputed)
          ?? throw new EntityNotFoundException($"{nameof(User)} with id '{id}' does not exist");

      return result;
    }

    public User? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _userRepository.Query(includeChildItems).SingleOrDefault(o => o.Id == id);
      if (result == null) return null;

      if (includeComputed)
      {
        result.PhotoURL = GetBlobObjectURL(result.PhotoStorageType, result.PhotoKey);
        result.Skills?.ForEach(o => o.Organizations?.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoStorageType, o.LogoKey)));
        result.Settings = SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.User), result.SettingsRaw);
      }

      return result;
    }

    public Settings GetByEmailSettings(string? email)
    {
      if (string.IsNullOrWhiteSpace(email))
        throw new ArgumentNullException(nameof(email));

      var result = GetByEmailOrNull(email, false, false)
          ?? throw new EntityNotFoundException($"User with email '{email}' does not exist");

      return SettingsHelper.Parse(_settingsDefinitionService.ListByEntityType(EntityType.User), result.SettingsRaw);
    }

    public List<User> Contains(string value, bool includeComputed)
    {
      if (string.IsNullOrWhiteSpace(value))
        throw new ArgumentNullException(nameof(value));
      value = value.Trim();

      var results = _userRepository.Contains(_userRepository.Query(), value).ToList();

      if (includeComputed)
      {
        results.ForEach(o => o.PhotoURL = GetBlobObjectURL(o.PhotoStorageType, o.PhotoKey));
        results.ForEach(o => o.Skills?.ForEach(o => o.Organizations?.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoStorageType, o.LogoKey))));
        results.ForEach(o => o.Settings = SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.User), o.SettingsRaw));
      }

      return results;
    }

    public UserSearchResults Search(UserSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _userSearchFilterValidator.ValidateAndThrow(filter);

      var query = _userRepository.Query();

      //only includes users which email has been confirmed (implies linked to identity provider)
      query = query.Where(o => o.EmailConfirmed);

      if (!string.IsNullOrEmpty(filter.ValueContains))
        query = _userRepository.Contains(query, filter.ValueContains);

      var results = new UserSearchResults();
      query = query.OrderBy(o => o.DisplayName).ThenBy(o => o.Id); //ensure deterministic sorting / consistent pagination results

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }
      results.Items = query.ToList().Select(o => o.ToInfo()).ToList();

      return results;
    }

    public async Task<User> Upsert(UserRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _userRequestValidator.ValidateAndThrowAsync(request);

      // check if user exists
      var isNew = !request.Id.HasValue;
      var result = !request.Id.HasValue ? new User { Id = Guid.NewGuid() } : GetById(request.Id.Value, false, false);

      var existingByEmail = GetByEmailOrNull(request.Email, false, false);
      if (existingByEmail != null && (isNew || result.Id != existingByEmail.Id))
        throw new ValidationException($"{nameof(User)} with the specified email address '{request.Email}' already exists");

      // profile fields updatable via UserProfileService.Update; identity provider is source of truth
      if (isNew)
      {
        var kcUser = await _identityProviderClient.GetUser(request.Email)
            ?? throw new InvalidOperationException($"{nameof(User)} with email '{request.Email}' does not exist");
        //preserve keycloak formatting for email, first name and surname
        result.Email = request.Email;
        result.FirstName = request.FirstName;
        result.Surname = request.Surname;
        result.DisplayName = request.DisplayName ?? string.Empty;
        result.SetDisplayName();
        result.PhoneNumber = request.PhoneNumber;
        result.CountryId = request.CountryId;
        result.EducationId = request.EducationId;
        result.GenderId = request.GenderId;
        result.DateOfBirth = request.DateOfBirth.RemoveTime();
      }

      result.EmailConfirmed = request.EmailConfirmed;
      result.DateLastLogin = request.DateLastLogin;
      result.ExternalId = request.ExternalId;

      result = isNew ? await _userRepository.Create(result) : await _userRepository.Update(result);

      return result;
    }

    public async Task<User> UpsertPhoto(string? email, IFormFile? file)
    {
      var result = GetByEmail(email, true, true);

      ArgumentNullException.ThrowIfNull(file, nameof(file));

      var currentPhotoId = result.PhotoId;

      BlobObject? blobObject = null;
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
          blobObject = await _blobService.Create(file, FileType.Photos);
          result.PhotoId = blobObject.Id;
          result.PhotoStorageType = blobObject.StorageType;
          result.PhotoKey = blobObject.Key;
          result = await _userRepository.Update(result);

          if (currentPhotoId.HasValue)
            await _blobService.Archive(currentPhotoId.Value, blobObject); //preserve / archive previous photo as they might be referenced in credentials

          scope.Complete();
        });
      }
      catch
      {
        //roll back
        if (blobObject != null)
          await _blobService.Delete(blobObject);

        throw;
      }

      result.PhotoURL = GetBlobObjectURL(result.PhotoStorageType, result.PhotoKey);

      return result;
    }

    public async Task<User> UpdateSettings(string? email, List<string>? roles, UserRequestSettings request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _userRequestSettingsValidator.ValidateAndThrowAsync(request);

      var result = GetByEmail(email, false, false);

      var definitions = _settingsDefinitionService.ListByEntityType(EntityType.User);

      var currentSettings = SettingsHelper.ToDictionary(result.SettingsRaw);

      SettingsHelper.Validate(definitions, roles, request.Settings, currentSettings);

      var settings = request.Settings;
      if (currentSettings != null)
        settings = settings.Concat(currentSettings.Where(kv => !settings.ContainsKey(kv.Key)))
          .ToDictionary(kv => kv.Key, kv => kv.Value);

      result.SettingsRaw = JsonConvert.SerializeObject(settings);
      result = await _userRepository.Update(result);

      result.Settings = SettingsHelper.ParseInfo(definitions, settings);
      return result;
    }

    public async Task AssignSkills(User user, Opportunity.Models.Opportunity opportunity)
    {
      ArgumentNullException.ThrowIfNull(user, nameof(user));

      ArgumentNullException.ThrowIfNull(opportunity, nameof(opportunity));

      var skillIds = opportunity.Skills?.Select(o => o.Id).ToList();
      if (skillIds == null || skillIds.Count == 0) return;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
        foreach (var skillId in skillIds)
        {
          var skill = _skillService.GetById(skillId);

          var item = _userSkillRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.SkillId == skill.Id);
          var itemOrganization = item != null ?
                    _userSkillOrganizationRepository.Query().SingleOrDefault(o => o.UserSkillId == item.Id && o.OrganizationId == opportunity.OrganizationId) : null;

          if (item == null)
          {
            item = new UserSkill { UserId = user.Id, SkillId = skill.Id };
            await _userSkillRepository.Create(item);
          }

          if (itemOrganization == null)
          {
            itemOrganization = new UserSkillOrganization { UserSkillId = item.Id, OrganizationId = opportunity.OrganizationId };
            await _userSkillOrganizationRepository.Create(itemOrganization);
          }
        }

        scope.Complete();
      });
    }

    public async Task<User> YoIDOnboard(string? email)
    {
      var result = GetByEmail(email, true, true);

      if (result.YoIDOnboarded.HasValue && result.YoIDOnboarded.Value)
        throw new ValidationException($"User with email '{email}' has already completed YoID onboarding");

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        result.YoIDOnboarded = true;
        result.DateYoIDOnboarded = DateTimeOffset.UtcNow;
        result = await _userRepository.Update(result);

        await _ssiTenantService.ScheduleCreation(EntityType.User, result.Id);
        await _ssiCredentialService.ScheduleIssuance(_appSettings.SSISchemaFullNameYoID, result.Id);

        scope.Complete();
      });

      return result;
    }

    public async Task TrackLogin(UserRequestLoginEvent request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      if (!request.UserId.HasValue || request.UserId.Value == Guid.Empty)
        throw new ArgumentNullException(nameof(request), "User Id required");

      if (string.IsNullOrWhiteSpace(request.ClientId))
        throw new ArgumentNullException(nameof(request), "Client Id required");
      request.ClientId = request.ClientId.Trim();

      request.IpAddress = request.IpAddress?.Trim();
      request.AuthMethod = request.AuthMethod?.Trim();
      request.AuthType = request.AuthType?.Trim();

      var item = new UserLoginHistory
      {
        UserId = request.UserId.Value,
        ClientId = request.ClientId,
        IpAddress = request.IpAddress,
        AuthMethod = request.AuthMethod,
        AuthType = request.AuthType
      };

      await _userLoginHistoryRepository.Create(item);
    }
    #endregion

    #region Private Members
    private string? GetBlobObjectURL(StorageType? storageType, string? key)
    {
      if (!storageType.HasValue || string.IsNullOrEmpty(key)) return null;
      return _blobService.GetURL(storageType.Value, key);
    }
    #endregion
  }
}
