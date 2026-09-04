using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Payout.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
  public interface IUserProfileService
  {
    UserProfile Get();

    Task<List<Country>?> ListPayoutCountries();

    Task<PayoutSession> PayoutRewards(decimal amount);

    Task<PayoutSession> GetPayoutSession();

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
