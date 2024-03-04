namespace Yoma.Core.Domain.Analytics.Models
{
    public class TimeIntervalSummary
    {
        public string[] Legend { get; set; }

        public List<TimeValueEntry> Data { get; set; }

        public int[] Count { get; set; }
    }
}
