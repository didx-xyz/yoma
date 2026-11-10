using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.IdentityProvider.Models;

namespace Yoma.Core.Domain.IdentityProvider.Interfaces
{
  public interface IIdentityProviderClient
  {
    bool AuthenticateWebhook(HttpContext httpContext);

    /// <summary>
    /// Identifies a configured client that authenticates on a user's behalf for background operations.
    /// Its events represent integration activity, not activity performed by the user.
    /// </summary>
    bool IsClientActingOnBehalfOfUser(string? clientId);

    Task<User?> GetUserByUsername(string? username);

    Task<User?> GetUserById(Guid id);

    /// <summary>
    /// Exchanges an authenticated user's access token for the configured target audience,
    /// retaining the same user identity. Returns the token and its expiry; authentication or
    /// exchange failures propagate without falling back to privileged background access.
    /// </summary>
    Task<UserAccessToken> ExchangeUserAccessToken(string accessToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// Privileged background access for a known identity. Never an authentication fallback.
    /// </summary>
    Task<UserAccessToken> GetUserAccessToken(Guid id, CancellationToken cancellationToken = default);

    Task<User> CreateUser(UserRequestCreate request);

    Task UpdateUser(UserRequestUpdate request);

    Task DeleteUser(Guid id);

    Task EnsureVerifyEmailActionRemovedIfNoEmail(Guid id);

    Task EnsureRoles(Guid id, List<string> roles);

    Task RemoveRoles(Guid id, List<string> roles);

    Task<List<User>?> ListByRole(string role);
  }
}
