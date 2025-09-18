namespace Yoma.Core.Domain.BlobProvider.Models
{
  public class ResumableUploadInfo
  {
    public string UploadId { get; set; }

    public string OriginalFileName { get; set; }

    public string Extension { get; set; }

    public string ContentType { get; set; }

    public long Length { get; set; }

    public string SourceBucket { get; set; }

    public string SourceKey { get; set; }
  }
}
