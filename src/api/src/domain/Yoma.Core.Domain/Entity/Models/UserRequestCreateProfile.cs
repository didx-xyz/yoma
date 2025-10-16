namespace Yoma.Core.Domain.Entity.Models
{
  public class UserRequestCreateProfile : UserRequestBase
  {
    public string FirstName { get; set; } = null!;

    public string Surname { get; set; } = null!;

    public string? PhoneNumber { get; set; }

    public string? CountryCodeAlpha2 { get; set; }
  }
}
