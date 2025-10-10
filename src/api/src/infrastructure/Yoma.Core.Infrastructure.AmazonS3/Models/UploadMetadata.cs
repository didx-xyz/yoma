namespace Yoma.Core.Infrastructure.AmazonS3.Models
{
  internal class UploadMetadata
  {
    public long UploadLength { get; set; }

    public Dictionary<string, string> Metadata { get; set; } = [];

    public DateTimeOffset Expires { get; set; }

    public string? MultipartUploadId { get; set; } // S3 multipart upload ID
  }
}
