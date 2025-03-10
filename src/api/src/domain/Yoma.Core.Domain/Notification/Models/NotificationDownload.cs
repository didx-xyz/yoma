using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationDownload : NotificationBase
  {
    [JsonProperty("dateStamp")]
    public DateTimeOffset DateStamp { get; set; }

    [JsonProperty("dateStampFormatted")]
    public string DateEndFormatted => DateStamp.ToString("ddd, MMM dd, yyyy HH:mm");

    [JsonProperty("fileName")]
    public string FileName { get; set; }

    [JsonProperty("fileURL")]
    public string FileURL { get; set; }

    [JsonProperty("expirationHours")]
    public int ExpirationHours { get; set; }
  }
}
