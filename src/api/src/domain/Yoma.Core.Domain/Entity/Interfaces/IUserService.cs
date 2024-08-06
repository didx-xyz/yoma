using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
  public interface IUserService
  {
    User GetByEmail(string? email, bool includeChildItems, bool includeComputed);

    User? GetByEmailOrNull(string email, bool includeChildItems, bool includeComputed);

    User GetById(Guid Id, bool includeChildItems, bool includeComputed);

    User? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed);

    Settings GetSettingsByEmail(string email);

    SettingsInfo GetSettingsInfoByEmail(string email);

    SettingsInfo GetSettingsInfoById(Guid id);

    SettingsInfo GetSettingsInfo(string? settingsRaw);

    List<User> Contains(string value, bool includeChildItems, bool includeComputed);

    UserSearchResults Search(UserSearchFilter filter);

    Task<User> Upsert(UserRequest request);

    Task<User> UpsertPhoto(string? email, IFormFile? file);

    Task<User> UpdateSettings(string? email, List<string> roles, SettingsRequest request);

    Task AssignSkills(User user, Opportunity.Models.Opportunity opportunity);

    Task<User> YoIDOnboard(string? email);

    Task TrackLogin(UserRequestLoginEvent request);
  }
}
