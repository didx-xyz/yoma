namespace Yoma.Core.Domain.BlobProvider.Models
{
  public class ResumableUploadInfo
  {
    public string UploadId { get; set; } = null!;

    public string OriginalFileName { get; set; } = null!;

    public string Extension { get; set; } = null!;

    public string ContentType { get; set; } = null!;

    public long Length { get; set; }

    public string SourceBucket { get; set; } = null!;

    public string SourceKey { get; set; } = null!;
  }
}
