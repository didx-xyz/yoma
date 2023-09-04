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

        Task<User> Upsert(UserRequest request);

        Task<User> UpsertPhoto(string? email, IFormFile? file);

        UserSearchResults Search(UserSearchFilter filter);

        Task AssignSkills(Guid id, List<Guid> skillIds);
    }
}
