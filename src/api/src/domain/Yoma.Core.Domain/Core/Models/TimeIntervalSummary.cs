namespace Yoma.Core.Domain.Core.Models
{
  public class TimeIntervalSummary
  {
    public string[] Legend { get; set; } = null!;

    public List<TimeValueEntry> Data { get; set; } = null!;

    public int[] Count { get; set; } = null!;
  }
}
