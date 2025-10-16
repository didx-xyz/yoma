namespace Yoma.Core.Domain.Entity.Models
{
  public class UserRequestUpdateProfile : UserRequestBase
  {
    public string FirstName { get; set; } = null!;

    public string Surname { get; set; } = null!;

    public Guid? CountryId { get; set; }

    public bool UpdatePhoneNumber { get; set; }

    public bool ResetPassword { get; set; }
  }
}
