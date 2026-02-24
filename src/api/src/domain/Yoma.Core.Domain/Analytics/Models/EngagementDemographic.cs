namespace Yoma.Core.Domain.Analytics.Models
{
  public class EngagementDemographic
  {
    public Demographic Education { get; set; } = null!;

    public Demographic Countries { get; set; } = null!;

    public Demographic Genders { get; set; } = null!;

    public Demographic Ages { get; set; } = null!;
  }
}
