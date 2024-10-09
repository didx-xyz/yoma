using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
  public interface IUserService
  {
    User GetByUsername(string? username, bool includeChildItems, bool includeComputed);

    User? GetByUsernameOrNull(string? username, bool includeChildItems, bool includeComputed);

    User? GetByEmailOrNull(string? email, bool includeChildItems, bool includeComputed);

    User? GetByPhoneOrNull(string? phoneNumber, bool includeChildItems, bool includeComputed);

    User? GetByExternalIdOrNull(Guid externalId, bool includeChildItems, bool includeComputed);

    User GetById(Guid Id, bool includeChildItems, bool includeComputed);

    User? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed);

    Settings GetSettingsByUsername(string username);

    SettingsInfo GetSettingsInfoByUsername(string username);

    SettingsInfo GetSettingsInfoById(Guid id);

    SettingsInfo GetSettingsInfo(string? settingsRaw);

    List<User> Contains(string value, bool includeChildItems, bool includeComputed);

    UserSearchResults Search(UserSearchFilter filter);

    Task<User> Upsert(UserRequest request);

    Task<User> UpsertPhoto(string? username, IFormFile? file);

    Task<User> UpdateSettings(string? username, List<string> roles, SettingsRequest request);

    Task AssignSkills(User user, Opportunity.Models.Opportunity opportunity);

    Task<User> YoIDOnboard(string? username);

    Task TrackLogin(UserRequestLoginEvent request);
  }
}
