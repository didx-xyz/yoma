namespace Yoma.Core.Domain.IdentityProvider.Models
{
  public abstract class UserRequestBase
  {
    public string Username { get; set; }

    public string? Email { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public string? PhoneNumber { get; set; }

    public string? Gender { get; set; }

    public string? Country { get; set; }

    public string? Education { get; set; }

    public string? DateOfBirth { get; set; }

    public bool HasEmail => !string.IsNullOrEmpty(Email);
  }
}
