namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationInfo
    {
        public Guid Id { get; set; }

        public string Name { get; set; }

        public string? Tagline { get; set; }

        public OrganizationStatus Status { get; set; }

        public string? LogoURL { get; set; }
    }
}
