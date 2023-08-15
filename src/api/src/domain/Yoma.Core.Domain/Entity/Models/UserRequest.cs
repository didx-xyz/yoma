namespace Yoma.Core.Domain.Entity.Models
{
  public class UserRequest
  {
    public Guid? Id { get; set; }

    public string Email { get; set; }

    public bool EmailConfirmed { get; set; }

    public string FirstName { get; set; }

    public string Surname { get; set; }

    public string? DisplayName { get; set; }

    public string? PhoneNumber { get; set; }

    public Guid? CountryId { get; set; }

    public Guid? CountryOfResidenceId { get; set; }

    public Guid? GenderId { get; set; }

    public DateTimeOffset? DateOfBirth { get; set; }

    public DateTimeOffset? DateLastLogin { get; set; }

    public Guid? ExternalId { get; set; }

    public Guid? ZltoWalletId { get; set; }

    public Guid? ZltoWalletCountryId { get; set; }

    public Guid? TenantId { get; set; }

  }
}
