using Microsoft.AspNetCore.Http;

namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationDocumentRequest
    {
        public IFormFile File { get; set; }

        public OrganizationDocumentType Type { get; set; }
    }
}
