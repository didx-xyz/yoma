namespace Yoma.Core.Domain.Entity.Models
{
    public class Organization
    {
        public Guid Id { get; set; }

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

        public Guid StatusId { get; set; }

        public OrganizationStatus Status { get; set; }

        public string? CommentApproval { get; set; }

        public DateTimeOffset? DateStatusModified { get; set; }

        public Guid? LogoId { get; set; }

        public string? LogoURL { get; set; }

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset DateModified { get; set; }

        public List<OrganizationDocument>? Documents { get; set; }

        public List<Lookups.OrganizationProviderType>? ProviderTypes { get; set; }

        public List<UserInfo>? Administrators { get; set; }
    }
}
