using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Entity.Models
{
  public class UserSkillInfo : Skill
  {
    public UserSkillType Type { get; set; }

    public List<UserSkillOrganizationInfo> Organizations { get; set; } = null!;
  }
}
