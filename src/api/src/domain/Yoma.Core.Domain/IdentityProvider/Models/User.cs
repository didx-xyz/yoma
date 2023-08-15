namespace Yoma.Core.Domain.IdentityProvider.Models
{
  public class User
  {
    public Guid Id { get; set; }

    public string Username { get; set; }

    public string Email { get; set; }

    public string FirstName { get; set; }

    public string LastName
    {
      get; set;
    }
    public string? PhoneNumber { get; set; }

    public string? Gender { get; set; }

    public string? CountryOfOrigin { get; set; }

    public string? CountryOfResidence { get; set; }

    public string? DateOfBirth { get; set; }

    public bool EmailVerified { get; set; }
  }
}
