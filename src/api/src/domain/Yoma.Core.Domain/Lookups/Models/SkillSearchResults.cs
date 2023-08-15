namespace Yoma.Core.Domain.Lookups.Models
{
  public class SkillSearchResults
  {
    public int? TotalCount { get; set; }

    public List<Skill> Items { get; set; }
  }
}
