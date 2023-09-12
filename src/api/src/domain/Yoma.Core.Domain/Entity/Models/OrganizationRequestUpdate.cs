using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationRequestUpdate : OrganizationRequestBase
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        public List<string> AdminEmails { get; set; }

        public List<Guid>? RegistrationDocumentsDelete { get; set; }

        public List<Guid>? EducationProviderDocumentsDelete { get; set; }

        public List<Guid>? BusinessDocumentsDelete { get; set; }
    }
}
