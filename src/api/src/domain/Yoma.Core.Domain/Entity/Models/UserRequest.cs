using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Entity.Models
{
    public class UserRequest : UserRequestBase
    {
        public Guid? Id { get; set; }

        [Required]
        public bool EmailConfirmed { get; set; }

        public DateTimeOffset? DateLastLogin { get; set; }

        public Guid? ExternalId { get; set; }
    }
}
