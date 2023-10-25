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

        Task AssignSkills(Guid id, List<Guid> skillIds);

        List<User> ListPendingSSITenantCreation(int batchSize);

        Task<User> UpdateSSITenantReference(Guid id, string tenantId);
    }
}
