namespace Yoma.Core.Domain.Entity.Models
{
  public class OrganizationUser
  {
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public Guid UserId { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
