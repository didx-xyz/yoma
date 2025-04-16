namespace Yoma.Core.Domain.Entity.Models
{
  public class UserRequestCreateProfile : UserRequestBase
  {
    public string FirstName { get; set; }

    public string Surname { get; set; }

    public string? PhoneNumber { get; set; }

    public string? CountryCodeAlpha2 { get; set; }
  }
}
