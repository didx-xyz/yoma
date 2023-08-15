namespace Yoma.Core.Domain.Entity.Models
{
  public class User

  {
    #region Public Members
    public Guid Id { get; set; }

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

    public Guid? PhotoId { get; set; }

    public string? PhotoURL { get; set; }

    public DateTimeOffset? DateLastLogin { get; set; }

    public Guid? ExternalId { get; set; }

    public Guid? ZltoWalletId { get; set; }

    public Guid? ZltoWalletCountryId { get; set; }

    public string? ZltoWalletCountryCodeAlpha2 { get; set; }

    public Guid? TenantId { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
    #endregion
  }
}

