using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationUpdateRequest : OrganizationRequestBase
    {
        [Required]
        public Guid Id { get; set; }
    }
}
