namespace Yoma.Core.Domain.Entity.Models
{
  public class UserSkill
  {
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid SkillId { get; set; }

    public UserSkillType Type { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
