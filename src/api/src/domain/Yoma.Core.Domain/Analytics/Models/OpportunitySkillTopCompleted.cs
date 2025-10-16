namespace Yoma.Core.Domain.Analytics.Models
{
  public class OpportunitySkillTopCompleted
  {
    public string Legend { get; set; } = null!;

    public List<OpportunitySkillCompleted> TopCompleted { get; set; } = null!;
  }
}
