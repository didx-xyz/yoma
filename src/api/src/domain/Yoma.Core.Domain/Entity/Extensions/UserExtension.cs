using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Extensions
{
    public static class UserExtension
    {
        public static void SetDisplayName(this User user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user));

            if (!string.IsNullOrEmpty(user.DisplayName)) return;
            user.DisplayName = string.Join(' ', new[] { user.FirstName, user.Surname }.Where(o => !string.IsNullOrEmpty(o)));
            if (string.IsNullOrEmpty(user.DisplayName)) user.DisplayName = null;
        }

        public static void SetDisplayName(this UserRequest user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user));

            if (!string.IsNullOrEmpty(user.DisplayName)) return;
            user.DisplayName = string.Join(' ', new[] { user.FirstName, user.Surname }.Where(o => !string.IsNullOrEmpty(o)));
            if (string.IsNullOrEmpty(user.DisplayName)) user.DisplayName = null;
        }

        public static UserRequest ToUserRequest(this User user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user));

            return new UserRequest
            {
                Id = user.Id,
                Email = user.Email,
                EmailConfirmed = user.EmailConfirmed,
                FirstName = user.FirstName,
                Surname = user.Surname,
                DisplayName = user.DisplayName,
                PhoneNumber = user.PhoneNumber,
                CountryId = user.CountryId,
                CountryOfResidenceId = user.CountryOfResidenceId,
                GenderId = user.GenderId,
                DateOfBirth = user.DateOfBirth,
                DateLastLogin = user.DateLastLogin,
                ExternalId = user.ExternalId,
                ZltoWalletId = user.ZltoWalletId,
                TenantId = user.TenantId
            };
        }

        public static UserInfo ToInfo(this User value)
        {
            if (value == null)
                throw new ArgumentNullException(nameof(value));

            return new UserInfo
            {
                Id = value.Id,
                Email = value.Email,
                FirstName = value.FirstName,
                Surname = value.Surname,
                DisplayName = value.DisplayName
            };
        }

        public static UserProfile ToProfile(this User value)
        {
            if (value == null)
                throw new ArgumentNullException(nameof(value));

            return new UserProfile
            {
                Id = value.Id,
                Email = value.Email,
                EmailConfirmed = value.EmailConfirmed,
                FirstName = value.FirstName,
                Surname = value.Surname,
                DisplayName = value.DisplayName,
                PhoneNumber = value.PhoneNumber,
                CountryId = value.CountryId,
                CountryOfResidenceId = value.CountryOfResidenceId,
                GenderId = value.GenderId,
                DateOfBirth = value.DateOfBirth,
                PhotoId = value.PhotoId,
                PhotoURL = value.PhotoURL,
                DateLastLogin = value.DateLastLogin,
                Skills = value.Skills
            };
        }
    }
}
