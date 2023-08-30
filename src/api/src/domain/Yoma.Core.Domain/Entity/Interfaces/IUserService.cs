using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Interfaces
{
    public interface IUserService
    {
        User GetByEmail(string? email);

        User? GetByEmailOrNull(string email);

        User GetById(Guid Id);

        Task<User> Upsert(UserRequest request);

        Task<User> UpsertPhoto(string? email, IFormFile? file);

        UserSearchResults Search(UserSearchFilter filter);
    }
}
