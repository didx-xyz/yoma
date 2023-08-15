namespace Yoma.Core.Domain.Entity.Models
{
  public class UserProfileRequest
  {
    public string Email { get; set; }

    public string FirstName { get; set; }

    public string Surname { get; set; }

    public string? DisplayName { get; set; }

    public string? PhoneNumber { get; set; }

    public Guid? CountryId { get; set; }

    public Guid? CountryOfResidenceId { get; set; }

    public Guid? GenderId { get; set; }

    public DateTimeOffset? DateOfBirth { get; set; }

    public bool ResetPassword { get; set; }
  }
}
