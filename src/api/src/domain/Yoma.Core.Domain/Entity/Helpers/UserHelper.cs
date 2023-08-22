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
    }
}
