using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
  public interface IUserProfileService
  {
    UserProfile Get();

    Settings GetSettings();

    Task<UserProfile> UpsertPhoto(IFormFile file);

    Task<UserProfile> UpdateSettings(UserRequestSettings settings);

    Task<UserProfile> Update(UserRequestProfile request);

    Task<UserProfile> YoIDOnboard();
  }
}
