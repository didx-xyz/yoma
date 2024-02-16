using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Entity.Models
{
    public abstract class UserRequestBase
    {
        [Required]
        public string Email { get; set; }

        [Required]
        public string FirstName { get; set; }

        [Required]
        public string Surname { get; set; }

        public string? DisplayName { get; set; }

        public string? PhoneNumber { get; set; }

        public Guid? CountryId { get; set; }

        public Guid? EducationId { get; set; }

        public Guid? GenderId { get; set; }

        public DateTimeOffset? DateOfBirth { get; set; }
    }
}
