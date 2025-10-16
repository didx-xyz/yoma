namespace Yoma.Core.Domain.Analytics.Models
{
  public class Demographic
  {
    public string Legend { get; set; } = null!;

    public Dictionary<string, int> Items { get; set; } = null!;
  }
}
