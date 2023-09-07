using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
    public interface IUserService
    {
        User GetByEmail(string? email, bool includeChildItems);

        User? GetByEmailOrNull(string email, bool includeChildItems);

        User GetById(Guid Id, bool includeChildItems);

        User? GetByIdOrNull(Guid id, bool includeChildItems);

        List<User> Contains(string value);

        UserSearchResults Search(UserSearchFilter filter);

        Task<User> Upsert(UserRequest request);

        Task<User> UpsertPhoto(string? email, IFormFile? file);

        Task AssignSkills(Guid id, List<Guid> skillIds);
    }
}
