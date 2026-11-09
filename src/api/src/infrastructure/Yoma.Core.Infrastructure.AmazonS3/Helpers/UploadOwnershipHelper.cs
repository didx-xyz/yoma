using System.Security.Claims;
using Yoma.Core.Domain.Core.Exceptions;

namespace Yoma.Core.Infrastructure.AmazonS3.Helpers
{
  internal static class UploadOwnershipHelper
  {
    /// <summary>
    /// Uses the authenticated identity-provider ID, which survives token refresh and contact changes.
    /// Never resolves ownership from client metadata, usernames or participant IDs in an attachment request.
    /// </summary>
    internal static Guid GetOwnerId(ClaimsPrincipal? user)
    {
      var subject = user?.FindFirstValue("sub") ?? user?.FindFirstValue(ClaimTypes.NameIdentifier);
      if (user?.Identity?.IsAuthenticated != true || !Guid.TryParse(subject, out var ownerId) || ownerId == Guid.Empty)
        throw new SecurityException("An authenticated user identity is required for uploads");

      return ownerId;
    }
  }
}
