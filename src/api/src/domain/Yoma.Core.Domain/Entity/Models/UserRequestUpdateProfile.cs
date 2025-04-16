namespace Yoma.Core.Domain.Entity.Models
{
  public class UserRequestUpdateProfile : UserRequestBase
  {
    public string FirstName { get; set; }

    public string Surname { get; set; }

    public Guid? CountryId { get; set; }

    public bool UpdatePhoneNumber { get; set; }

    public bool ResetPassword { get; set; }
  }
}
