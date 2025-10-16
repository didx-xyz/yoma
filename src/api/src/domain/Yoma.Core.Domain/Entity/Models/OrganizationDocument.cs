using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;

namespace Yoma.Core.Domain.Entity.Models
{
  public class OrganizationDocument
  {
    [JsonIgnore]
    public Guid Id { get; set; }

    [JsonIgnore]
    public Guid OrganizationId { get; set; }

    public Guid FileId { get; set; }

    [JsonIgnore]
    public StorageType FileStorageType { get; set; }

    [JsonIgnore]
    public string FileKey { get; set; } = null!;

    public OrganizationDocumentType Type { get; set; }

    public string ContentType { get; set; } = null!;

    public string OriginalFileName { get; set; } = null!;

    public string Url { get; set; } = null!;

    [JsonIgnore]
    public IFormFile File { get; set; } = null!;

    public DateTimeOffset DateCreated { get; set; }
  }
}
