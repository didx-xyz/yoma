using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationRequestCreate : OrganizationRequestBase
    {
        [Required]
        public List<Guid> ProviderTypes { get; set; }

        [Required]
        public IFormFile Logo { get; set; }

        [Required]
        public bool AddCurrentUserAsAdmin { get; set; }

        public List<string>? AdminAdditionalEmails { get; set; }

        [Required]
        public List<IFormFile> RegistrationDocuments { get; set; }

        public List<IFormFile>? EducationProviderDocuments { get; set; }

        public List<IFormFile>? BusinessDocuments { get; set; }
    }
}
