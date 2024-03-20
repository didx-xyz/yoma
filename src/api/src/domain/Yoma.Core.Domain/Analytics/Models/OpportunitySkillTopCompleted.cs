namespace Yoma.Core.Domain.Analytics.Models
{
  public class OpportunitySkillTopCompleted
  {
    public string Legend { get; set; }

    public List<Lookups.Models.Skill> TopCompleted { get; set; }
  }
}
