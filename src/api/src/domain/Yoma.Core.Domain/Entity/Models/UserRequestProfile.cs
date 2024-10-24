namespace Yoma.Core.Domain.Entity.Models
{
  public class UserRequestProfile : UserRequestBase
  {
    public string FirstName { get; set; }

    public string Surname { get; set; }

    public bool UpdatePhoneNumber { get; set; }

    public bool ResetPassword { get; set; }
  }
}
