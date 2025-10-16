using Yoma.Core.Domain.BlobProvider;

namespace Yoma.Core.Domain.Core.Models
{
  public class BlobObject
  {
    public Guid Id { get; set; }

    public StorageType StorageType { get; set; }

    public FileType FileType { get; set; }

    public string Key { get; set; } = null!;

    public string ContentType { get; set; } = null!;

    public string OriginalFileName { get; set; } = null!;

    public Guid? ParentId { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
