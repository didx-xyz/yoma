using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationRequestUpdate : OrganizationRequestBase
    {
        [Required]
        public Guid Id { get; set; }
    }
}
