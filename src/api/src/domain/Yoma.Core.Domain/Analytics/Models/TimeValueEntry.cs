namespace Yoma.Core.Domain.Analytics.Models
{
    public class TimeValueEntry
    {
        public DateTimeOffset Date { get; private set; }

        public List<object> Values { get; private set; } = new List<object>();

        public TimeValueEntry(DateTimeOffset date, params object[] values)
        {
            Date = date;
            Values.AddRange(values);
        }
    }
}
