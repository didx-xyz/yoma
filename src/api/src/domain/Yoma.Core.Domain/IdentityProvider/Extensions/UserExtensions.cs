using Yoma.Core.Domain.IdentityProvider.Models;

namespace Yoma.Core.Domain.IdentityProvider.Helpers
{
    public static class UserExtensions
    {
        public static string? ToDisplayName(this User user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user));

            var result = string.Join(' ', new[] { user.FirstName, user.LastName }.Where(o => !string.IsNullOrEmpty(o)));
            if (string.IsNullOrEmpty(result)) result = null;
            return result;
        }
    }
}
