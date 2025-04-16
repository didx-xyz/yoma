using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.IdentityProvider.Models;

namespace Yoma.Core.Domain.IdentityProvider.Interfaces
{
  public interface IIdentityProviderClient
  {
    bool AuthenticateWebhook(HttpContext httpContext);

    Task<User?> GetUserByUsername(string? username);

    Task<User?> GetUserById(Guid id);

    Task<User> CreateUser(UserRequestCreate request);

    Task UpdateUser(UserRequestUpdate request);

    Task DeleteUser(Guid id);

    Task EnsureVerifyEmailActionRemovedIfNoEmail(Guid id);

    Task EnsureRoles(Guid id, List<string> roles);

    Task RemoveRoles(Guid id, List<string> roles);

    Task<List<User>?> ListByRole(string role);
  }
}
