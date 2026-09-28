namespace Yoma.Core.Domain.Entity.Models
{
  public class UserRequestCreateProfile : UserRequestProfileBase
  {
    public string? PhoneNumber { get; set; }

    public string CountryCodeAlpha2 { get; set; } = null!;
  }
}
