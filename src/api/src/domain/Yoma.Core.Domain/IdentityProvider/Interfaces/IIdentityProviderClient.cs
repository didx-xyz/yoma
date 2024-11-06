using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.IdentityProvider.Models;

namespace Yoma.Core.Domain.IdentityProvider.Interfaces
{
  public interface IIdentityProviderClient
  {
    bool AuthenticateWebhook(HttpContext httpContext);

    Task<User?> GetUserByUsername(string? username);

    Task<User?> GetUserById(string? id);

    Task UpdateUser(User user, bool resetPassword, bool sendVerifyEmail, bool updatePhoneNumber);

    Task EnsureRoles(Guid id, List<string> roles);

    Task RemoveRoles(Guid id, List<string> roles);

    Task<List<User>?> ListByRole(string role);
  }
}
