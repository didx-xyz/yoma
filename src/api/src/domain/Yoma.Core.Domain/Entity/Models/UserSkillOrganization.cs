namespace Yoma.Core.Domain.Entity.Models
{
  public class UserSkillOrganization
  {
    public Guid Id { get; set; }

    public Guid UserSkillId { get; set; }

    public Guid OrganizationId { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
