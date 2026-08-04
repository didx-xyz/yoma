using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Payout.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
  public interface IUserProfileService
  {
    UserProfile Get();

    Task<PayoutInfo> PayoutRewards(decimal amount);

    List<UserSkillInfo>? GetSkills();

    Settings GetSettings();

    Task<UserProfile> UpsertPhoto(IFormFile file);

    Task<UserProfile> DeletePhoto();

    Task<UserProfile> UpdateSettings(SettingsRequest settings);

    Task<UserProfile> Create(UserRequestCreateProfile request);

    Task<UserProfile> Update(UserRequestUpdateProfile request);

    Task<UserProfile> YoIDOnboard();
  }
}
