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

    public bool Approved { get; set; }

    public DateTimeOffset? DateApproved { get; set; }

    public bool Active { get; set; }

    public DateTimeOffset? DateDeactivated { get; set; }

    public Guid? LogoId { get; set; }

    public string? LogoURL { get; set; }

    public Guid? CompanyRegistrationDocumentId { get; set; }

    public string? CompanyRegistrationDocumentURL { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
