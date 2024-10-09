namespace Yoma.Core.Domain.Entity.Models
{
  public class UserRequestProfile : UserRequestBase
  {
    public bool UpdatePhoneNumber { get; set; } 

    public bool ResetPassword { get; set; }
  }
}
