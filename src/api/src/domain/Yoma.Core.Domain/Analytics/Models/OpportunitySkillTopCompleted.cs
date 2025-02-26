namespace Yoma.Core.Domain.Analytics.Models
{
  public class OpportunitySkillTopCompleted
  {
    public string Legend { get; set; }

    public List<OpportunitySkillCompleted> TopCompleted { get; set; }
  }
}
