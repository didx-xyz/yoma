using Newtonsoft.Json;

namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationDownload : NotificationBase
  {
    [JsonProperty("fileName")]
    public string FileName { get; set; }

    [JsonProperty("fileURL")]
    public string FileURL { get; set; }
  }
}
