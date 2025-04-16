namespace Yoma.Core.Domain.IdentityProvider.Models
{
  public class UserRequestUpdate : UserRequestBase
  {
    public Guid Id { get; set; }

    public bool ResetPassword { get; set; }

    public bool VerifyEmail { get; set; }

    public bool UpdatePhoneNumber { get; set; }
  }
}
