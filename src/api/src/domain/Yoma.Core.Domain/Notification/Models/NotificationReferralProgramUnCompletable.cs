using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public sealed class NotificationReferralProgramUnCompletable : NotificationBase
  {
    [JsonProperty("withinNextDays")]
    public int? WithinNextDays { get; set; }

    [JsonProperty("programs")]
    public List<NotificationReferralProgramUnCompletableItem> Programs { get; set; } = null!;

    public override List<NotificationBase> FlattenItems()
    {
      if (Programs == null || Programs.Count == 0)
        throw new InvalidOperationException($"{nameof(Programs)} are not set or empty");

      return [.. Programs.Select(item => new NotificationReferralProgramUnCompletable
      {
        SubjectSuffix = SubjectSuffix,
        RecipientDisplayName = RecipientDisplayName,
        WithinNextDays = WithinNextDays,
        Programs = [item]
      })];
    }
  }

  public sealed class NotificationReferralProgramUnCompletableItem
  {
    [JsonProperty("name")]
    public string Name { get; set; } = null!;

    [JsonProperty("dateUnCompletable")]
    public DateTimeOffset DateUnCompletable { get; set; }

    [JsonProperty("dateUnCompletableFormatted")]
    public string DateUnCompletableFormatted => DateUnCompletable.ToString("ddd, MMM dd, yyyy HH:mm");

    [JsonProperty("dateStart")]
    public DateTimeOffset DateStart { get; set; }

    [JsonProperty("dateStartFormatted")]
    public string DateStartFormatted => DateStart.ToString("ddd, MMM dd, yyyy HH:mm");

    [JsonProperty("dateEnd")]
    public DateTimeOffset? DateEnd { get; set; }

    [JsonProperty("dateEndFormatted")]
    public string DateEndFormatted => DateEnd.HasValue ? DateEnd.Value.ToString("ddd, MMM dd, yyyy HH:mm") : "No end date";

    [JsonProperty("url")]
    public string URL { get; set; } = null!;
  }
}
