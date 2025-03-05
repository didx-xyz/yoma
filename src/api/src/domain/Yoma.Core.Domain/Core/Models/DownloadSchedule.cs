using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;

namespace Yoma.Core.Domain.Core.Models
{
  public class DownloadSchedule
  {
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    
    public string Type { get; set; }

    public string Filter { get; set; }

    public string FilterHash { get; set; }

    public Guid StatusId { get; set; }

    public DownloadScheduleStatus Status { get; set; }

    public Guid? FileId { get; set; }

    [JsonIgnore]
    public StorageType? FileStorageType { get; set; }

    [JsonIgnore]
    public string? FileKey { get; set; }

    public string? ErrorReason { get; set; }

    public byte? RetryCount { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
