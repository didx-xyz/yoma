using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.Analytics.Models
{
    public class TimeIntervalSummary
    {
        public TimeInterval TimeInterval { get; set; } = TimeInterval.Week;

        public List<Tuple<int, int>> Data { get; set; }

        public int Count { get; set; }
    }
}
