using Yoma.Core.Domain.IdentityProvider.Models;

namespace Yoma.Core.Domain.IdentityProvider.Extensions
{
  public static class UserExtensions
  {
    public static string? ToDisplayName(this User user)
    {
      ArgumentNullException.ThrowIfNull(user, nameof(user));

      var result = string.Join(' ', new[] { user.FirstName, user.LastName }.Where(o => !string.IsNullOrEmpty(o)));
      if (string.IsNullOrEmpty(result)) result = null;
      return result;
    }
  }
}
