namespace Yoma.Core.Domain.Entity.Models
{
  public class UserInfo
  {
    public Guid Id { get; set; }

    public string Username { get; set; }

    public string? Email { get; set; }

    public bool? EmailConfirmed { get; set; }

    public string? FirstName { get; set; }

    public string? Surname { get; set; }

    public string? DisplayName { get; set; }

    public string? PhoneNumber { get; set; }

    public bool? PhoneNumberConfirmed { get; set; }

    public Guid? CountryId { get; set; }

    public override bool Equals(object? obj)
    {
      if (obj == null || obj is not UserInfo) return false;

      var other = (UserInfo)obj;
      return Id.Equals(other.Id);
    }

    public override int GetHashCode()
    {
      return Id.GetHashCode();
    }
  }
}
