using Microsoft.AspNetCore.Http;

namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationCreateRequest : OrganizationRequestBase
    {
        public List<Guid> ProviderTypeIds { get; set; }

        public IFormFile Logo { get; set; }

        public bool AddCurrentUserAsAdmin { get; set; }

        public List<string>? AdminAdditionalEmails { get; set; }

        public List<IFormFile> RegistrationDocuments { get; set; }

        public List<IFormFile>? EducationProviderDocuments { get; set; }

        public List<IFormFile>? BusinessDocuments { get; set; }
    }
}
