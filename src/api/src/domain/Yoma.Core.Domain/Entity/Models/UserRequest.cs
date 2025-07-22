namespace Yoma.Core.Domain.Entity.Models
{
  public class UserRequest : UserRequestBase
  {
    public Guid? Id { get; set; }

    public string Username { get; set; }

    public string? FirstName { get; set; }

    public string? Surname { get; set; }

    public string? PhoneNumber { get; set; }

    public Guid? CountryId { get; set; }

    public bool? EmailConfirmed { get; set; }

    public bool? PhoneNumberConfirmed { get; set; }

    public DateTimeOffset? DateLastLogin { get; set; }

    public Guid? ExternalId { get; set; }
  }
}
