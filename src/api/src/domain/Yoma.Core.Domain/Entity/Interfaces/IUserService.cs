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

        List<User> Contains(string value, bool includeComputed);

        UserSearchResults Search(UserSearchFilter filter);

        Task<User> Upsert(UserRequest request);

        Task<User> UpsertPhoto(string? email, IFormFile? file);

        Task AssignSkills(User user, Opportunity.Models.Opportunity opportunity);

        Task<User> YoIDOnboard(string? email);
    }
}
