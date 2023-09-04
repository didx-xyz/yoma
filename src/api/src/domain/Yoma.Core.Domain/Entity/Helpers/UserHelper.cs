using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Helpers
{
    public static class UserHelper
    {
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
