namespace Yoma.Core.Domain.Entity.Models
{
    public class UserInfo
    {
        public Guid Id { get; set; }

        public string Email { get; set; }

        public string FirstName { get; set; }

        public string Surname { get; set; }

        public string? DisplayName { get; set; }
    }
}
