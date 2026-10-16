namespace Yoma.Core.Domain.Entity.Models
{
  public class UserRequestUpdateProfile : UserRequestProfileBase
  {
    public Guid CountryId { get; set; }

    public bool UpdatePhoneNumber { get; set; }

    public bool ResetPassword { get; set; }
  }
}
