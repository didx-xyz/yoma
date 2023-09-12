using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationRequestCreate : OrganizationRequestBase
    {
        [Required]
        public bool AddCurrentUserAsAdmin { get; set; }

        public List<string>? AdminAdditionalEmails { get; set; }

        [Required]
        public new List<IFormFile> RegistrationDocuments { get; set; }
    }
}
