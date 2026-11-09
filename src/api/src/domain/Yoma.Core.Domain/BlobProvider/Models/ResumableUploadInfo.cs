namespace Yoma.Core.Domain.BlobProvider.Models
{
  public class ResumableUploadInfo
  {
    public string UploadId { get; set; } = null!;

    public string OriginalFileName { get; set; } = null!;

    public string Extension { get; set; } = null!;

    public string ContentType { get; set; } = null!;

    /// <summary>
    /// Original MIME metadata, or null when omitted. Attachment processing resolves it again
    /// with the selected category so an earlier fallback does not override voice-note types.
    /// </summary>
    public string? SuppliedContentType { get; set; }

    public long Length { get; set; }

    public string SourceBucket { get; set; } = null!;

    public string SourceKey { get; set; } = null!;
  }
}
