namespace Yoma.Core.Domain.Core.Models
{
  public class TimeValueEntry
  {
    public DateTimeOffset Date { get; private set; }

    public object[] Values { get; private set; }

    public TimeValueEntry(DateTimeOffset date, params object[] values)
    {
      Date = date;
      Values = values;
    }
  }
}
