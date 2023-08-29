using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
    public interface IUserProfileService
    {
        UserProfile Get();

        Task<UserProfile> UpsertPhoto(IFormFile file);

        Task<UserProfile> Update(UserProfileRequest request);
    }
}
