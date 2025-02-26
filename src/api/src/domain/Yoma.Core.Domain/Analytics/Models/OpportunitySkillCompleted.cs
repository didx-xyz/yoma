namespace Yoma.Core.Domain.Analytics.Models
{
  public class OpportunitySkillCompleted
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string? InfoURL { get; set; }

    public int CountCompleted { get; set; }
  }
}
