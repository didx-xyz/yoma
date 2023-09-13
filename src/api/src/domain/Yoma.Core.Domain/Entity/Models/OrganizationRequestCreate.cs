using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationRequestCreate : OrganizationRequestBase
    {
        [Required]
        public new IFormFile? Logo { get; set; }

        [Required]
        public new List<IFormFile> RegistrationDocuments { get; set; }
    }
}
