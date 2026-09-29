namespace Yoma.Core.Domain.Lookups.Models
{
  public class SustainableDevelopmentGoal
  {
    public Guid Id { get; set; }

    public short Number { get; set; }

    public string Name { get; set; } = null!;
  }
}
