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
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;

namespace Yoma.Core.Domain.Entity.Services
{
  public class UserService : IUserService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IBlobService _blobService;
    private readonly ISkillService _skillService;
    private readonly ISSITenantService _ssiTenantService;
    private readonly ISSICredentialService _ssiCredentialService;
    private readonly ISettingsDefinitionService _settingsDefinitionService;
    private readonly UserRequestValidator _userRequestValidator;
    private readonly UserSearchFilterValidator _userSearchFilterValidator;
    private readonly SettingsRequestValidator _settingsRequestValidator;
    private readonly IRepositoryValueContainsWithNavigation<User> _userRepository;
    private readonly IRepository<UserSkill> _userSkillRepository;
    private readonly IRepository<UserSkillOrganization> _userSkillOrganizationRepository;
    private readonly IRepository<UserLoginHistory> _userLoginHistoryRepository;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public UserService(
        IOptions<AppSettings> appSettings,
        IBlobService blobService,
        ISkillService skillService,
        ISSITenantService ssiTenantService,
        ISSICredentialService ssiCredentialService,
        ISettingsDefinitionService settingsDefinitionService,
        UserRequestValidator userValidator,
        UserSearchFilterValidator userSearchFilterValidator,
        SettingsRequestValidator settingsRequestValidator,
        IRepositoryValueContainsWithNavigation<User> userRepository,
        IRepository<UserSkill> userSkillRepository,
        IRepository<UserSkillOrganization> userSkillOrganizationRepository,
        IRepository<UserLoginHistory> userLoginHistoryRepository,
        IExecutionStrategyService executionStrategyService)
    {
      _appSettings = appSettings.Value;
      _blobService = blobService;
      _skillService = skillService;
      _ssiTenantService = ssiTenantService;
      _ssiCredentialService = ssiCredentialService;
      _settingsDefinitionService = settingsDefinitionService;
      _userRequestValidator = userValidator;
      _userSearchFilterValidator = userSearchFilterValidator;
      _settingsRequestValidator = settingsRequestValidator;
      _userRepository = userRepository;
      _userSkillRepository = userSkillRepository;
      _userSkillOrganizationRepository = userSkillOrganizationRepository;
      _userLoginHistoryRepository = userLoginHistoryRepository;
      _executionStrategyService = executionStrategyService;
    }
    #endregion

    #region Public Members
    public User GetByUsername(string username, bool includeChildItems, bool includeComputed)
    {
      var result = GetByUsernameOrNull(username, includeChildItems, includeComputed)
          ?? throw new EntityNotFoundException($"User with username '{username}' does not exist");

      return result;
    }

    public User? GetByUsernameOrNull(string? username, bool includeChildItems, bool includeComputed)
    {
      username = username?.Trim();
      ArgumentException.ThrowIfNullOrEmpty(username, nameof(username));

      if (username.Contains('@'))
        return GetByEmailOrNull(username, includeChildItems, includeComputed);
      else
        return GetByPhoneOrNull(username, includeChildItems, includeComputed);
    }

    public User? GetByEmailOrNull(string? email, bool includeChildItems, bool includeComputed)
    {
      email = email?.Trim();
      if (string.IsNullOrEmpty(email)) return null;

      var query = _userRepository.Query(includeChildItems)
#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
          .Where(o => !string.IsNullOrEmpty(o.Email) && o.Email.ToLower() == email.ToLower());
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons

      var result = query.SingleOrDefault();

      if (result == null) return null;

      if (includeComputed)
      {
        result.PhotoURL = GetBlobObjectURL(result.PhotoStorageType, result.PhotoKey);
        result.Skills?.ForEach(o => o.Organizations?.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoStorageType, o.LogoKey)));
        result.Settings = SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.User), result.SettingsRaw);
      }

      return result;
    }

    public User? GetByPhoneOrNull(string? phoneNumber, bool includeChildItems, bool includeComputed)
    {
      phoneNumber = phoneNumber?.Trim();
      if (string.IsNullOrEmpty(phoneNumber)) return null;
      var query = _userRepository.Query(includeChildItems)
          .Where(o => !string.IsNullOrEmpty(o.PhoneNumber) && o.PhoneNumber == phoneNumber);

      var result = query.SingleOrDefault();

      if (result == null) return null;

      if (includeComputed)
      {
        result.PhotoURL = GetBlobObjectURL(result.PhotoStorageType, result.PhotoKey);
        result.Skills?.ForEach(o => o.Organizations?.ForEach(o => o.LogoURL = GetBlobObjectURL(o.LogoStorageType, o.LogoKey)));
        result.Settings = SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.User), result.SettingsRaw);
      }

      return result;
    }

    public User? GetByExternalIdOrNull(Guid externalId, bool includeChildItems, bool includeComputed)
    {
      if (externalId == Guid.Empty)
        throw new ArgumentNullException(nameof(externalId));

      var result = _userRepository.Query(includeChildItems).SingleOrDefault(o => o.ExternalId == externalId);
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

    public Settings GetSettingsByUsername(string username)
    {
      var user = GetByUsername(username, false, false);
      return SettingsHelper.Parse(_settingsDefinitionService.ListByEntityType(EntityType.User), user.SettingsRaw);
    }

    public SettingsInfo GetSettingsInfoByUsername(string username)
    {
      var user = GetByUsername(username, false, false);
      return SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.User), user.SettingsRaw);
    }

    public SettingsInfo GetSettingsInfoById(Guid id)
    {
      var user = GetById(id, false, false);
      return SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.User), user.SettingsRaw);
    }

    public SettingsInfo GetSettingsInfo(string? settingsRaw)
    {
      return SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.User), settingsRaw);
    }

    public List<User> Contains(string value, bool includeChildItems, bool includeComputed)
    {
      if (string.IsNullOrWhiteSpace(value))
        throw new ArgumentNullException(nameof(value));
      value = value.Trim();

      var results = _userRepository.Contains(_userRepository.Query(includeChildItems), value).ToList();

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

      //only includes users with associated external id's (implies linked to identity provider)
      query = query.Where(o => o.ExternalId.HasValue);

      //yoIDOnboarded
      if (filter.YoIDOnboarded == true)
        query = query.Where(o => o.YoIDOnboarded == true);

      //valueContains
      if (!string.IsNullOrEmpty(filter.ValueContains))
        query = _userRepository.Contains(query, filter.ValueContains);

      var results = new UserSearchResults();
      query = query.OrderBy(o => o.DisplayName).ThenBy(o => o.Id); //ensure deterministic sorting / consistent pagination results

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }
      results.Items = [.. query.ToList().Select(o => o.ToInfo())];

      return results;
    }

    public async Task<User> Upsert(UserRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      request.PhoneNumber = request.PhoneNumber?.NormalizePhoneNumber(true);

      await _userRequestValidator.ValidateAndThrowAsync(request);

      var usernameExpected = request.Email ?? request.PhoneNumber;
      if (!string.Equals(request.Username, usernameExpected))
        throw new InvalidOperationException($"Username '{request.Username}' does not match expected value '{usernameExpected}'");

      // check if user exists
      var isNew = !request.Id.HasValue;
      var result = !request.Id.HasValue ? new User { Id = Guid.NewGuid() } : GetById(request.Id.Value, false, false);

      var existingByEmail = GetByEmailOrNull(request.Email, false, false);
      if (existingByEmail != null && (isNew || result.Id != existingByEmail.Id))
        throw new ValidationException($"{nameof(User)} with the specified email address '{request.Email}' already exists");

      var existingByPhone = GetByPhoneOrNull(request.PhoneNumber, false, false);
      if (existingByPhone != null && (isNew || result.Id != existingByPhone.Id))
        throw new ValidationException($"{nameof(User)} with the specified phone number '{request.PhoneNumber}' already exists");

      // profile fields updatable via UserProfileService.Update; identity provider is source of truth
      if (isNew)
      {
        result.FirstName = request.FirstName;
        result.Surname = request.Surname;
        result.DisplayName = request.DisplayName;
        result.SetDisplayName();
        result.CountryId = request.CountryId;
        result.EducationId = request.EducationId;
        result.GenderId = request.GenderId;
        result.DateOfBirth = request.DateOfBirth.RemoveTime();
        result.Settings = SettingsHelper.ParseInfo(_settingsDefinitionService.ListByEntityType(EntityType.User), (string?)null);
      }

      result.Username = request.Username;
      result.Email = request.Email;
      result.EmailConfirmed = request.EmailConfirmed;
      result.PhoneNumber = request.PhoneNumber;
      result.PhoneNumberConfirmed = request.PhoneNumberConfirmed;
      result.DateLastLogin = request.DateLastLogin;
      result.ExternalId = request.ExternalId;

      result = isNew ? await _userRepository.Create(result) : await _userRepository.Update(result);

      return result;
    }

    public async Task<User> UpsertPhoto(string username, IFormFile? file)
    {
      var result = GetByUsername(username, true, true);

      ArgumentNullException.ThrowIfNull(file, nameof(file));

      var currentPhotoId = result.PhotoId;

      BlobObject? blobObject = null;
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
          blobObject = await _blobService.Create(file, FileType.Photos, StorageType.Public);
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

    public async Task<User> UpdateSettings(string username, List<string>? roles, SettingsRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _settingsRequestValidator.ValidateAndThrowAsync(request);

      var result = GetByUsername(username, false, false);

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

    public async Task<User> YoIDOnboard(string username)
    {
      var result = GetByUsername(username, true, true);

      return await YoIDOnboard(result);
    }

    public async Task<User> YoIDOnboard(User user)
    {
      ArgumentNullException.ThrowIfNull(user, nameof(user));

      if (user.YoIDOnboarded.HasValue && user.YoIDOnboarded.Value)
        return user;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

        user.YoIDOnboarded = true;
        user.DateYoIDOnboarded = DateTimeOffset.UtcNow;
        user = await _userRepository.Update(user);

        await _ssiTenantService.ScheduleCreation(EntityType.User, user.Id);
        await _ssiCredentialService.ScheduleIssuance(_appSettings.SSISchemaFullNameYoID, user.Id);

        scope.Complete();
      });

      return user;
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
      request.IdentityProvider = request.IdentityProvider?.Trim();

      var item = new UserLoginHistory
      {
        UserId = request.UserId.Value,
        ClientId = request.ClientId,
        IpAddress = request.IpAddress,
        AuthMethod = request.AuthMethod,
        AuthType = request.AuthType,
        IdentityProvider = request.IdentityProvider
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
