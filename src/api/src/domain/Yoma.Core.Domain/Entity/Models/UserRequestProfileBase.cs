namespace Yoma.Core.Domain.Entity.Models
{
  public abstract class UserRequestProfileBase : UserRequestBase
  {
    public string FirstName { get; set; } = null!;

    public string Surname { get; set; } = null!;
  }
}
