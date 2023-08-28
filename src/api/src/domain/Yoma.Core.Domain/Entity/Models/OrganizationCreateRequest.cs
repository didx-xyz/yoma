using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationCreateRequest
    {
        public string Name { get; set; }

        public string? WebsiteURL { get; set; }

        public string? PrimaryContactName { get; set; }

        public string? PrimaryContactEmail { get; set; }

        public string? PrimaryContactPhone { get; set; }

        public string? VATIN { get; set; }

        public string? TaxNumber { get; set; }

        public string? RegistrationNumber { get; set; }

        public string? City { get; set; }

        public Guid? CountryId { get; set; }

        public string? StreetAddress { get; set; }

        public string? Province { get; set; }

        public string? PostalCode { get; set; }

        public string? Tagline { get; set; }

        public string? Biography { get; set; }

        public List<Guid> ProviderTypeIds { get; set; }

        public IFormFile Logo { get; set; }

        public bool AddCurrentUserAsAdmin { get; set; }

        public List<string>? AdminAdditionalEmails { get; set; }

        public List<IFormFile> RegistrationDocuments { get; set; }

        public List<IFormFile>? EducationProviderDocuments { get; set; }

        public List<IFormFile>? BusinessDocuments { get; set; }
    }
}
