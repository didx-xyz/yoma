using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationOpportunityExpiration : NotificationBase
  {
    [JsonProperty("withinNextDays")]
    public int? WithinNextDays { get; set; }

    [JsonProperty("opportunities")]
    public List<NotificationOpportunityExpirationItem> Opportunities { get; set; }

    public override List<NotificationBase> FlattenItems()
    {
      if (Opportunities == null || Opportunities.Count == 0)
        throw new InvalidOperationException($"{nameof(Opportunities)} are not set or empty");

      return [.. Opportunities.Select(item => new NotificationOpportunityExpiration
      {
        SubjectSuffix = SubjectSuffix,
        RecipientDisplayName = RecipientDisplayName,
        WithinNextDays = WithinNextDays,
        Opportunities = [item]
      })];
    }
  }

  public class NotificationOpportunityExpirationItem
  {
    [JsonProperty("title")]
    public string Title { get; set; }

    [JsonProperty("dateStart")]
    public DateTimeOffset DateStart { get; set; }

    [JsonProperty("dateStartFormatted")]
    public string DateStartFormatted => DateStart.ToString("ddd, MMM dd, yyyy HH:mm");

    [JsonProperty("dateEnd")]
    public DateTimeOffset? DateEnd { get; set; }

    [JsonProperty("dateEndFormatted")]
    public string DateEndFormatted => DateEnd.HasValue ? DateEnd.Value.ToString("ddd, MMM dd, yyyy HH:mm") : "No end date";

    [JsonProperty("url")]
    public string URL { get; set; }
  }
}
