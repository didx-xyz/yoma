using Yoma.Core.Domain.BlobProvider;

namespace Yoma.Core.Infrastructure.AmazonS3.Models
{
  public class AWSS3Options
  {
    public const string Section = "AWSS3";

    public Dictionary<StorageType, AWSS3OptionsBucket> Buckets { get; set; } = null!;

    public AWSS3OptionsTus Tus { get; set; } = null!;
  }

  public class AWSS3OptionsBucket
  {
    public string Region { get; set; } = null!;

    public string AccessKey { get; set; } = null!;

    public string SecretKey { get; set; } = null!;

    public string BucketName { get; set; } = null!;

    public int? URLExpirationInMinutes { get; set; }
  }

  public class AWSS3OptionsTus
  {
    public string UrlPath { get; set; } = null!;

    public string KeyPrefix { get; set; } = null!;

    public int ExpirationMinutes { get; set; }

    public bool AllowEmptyMetadata { get; set; }

    public bool UsePipelinesIfAvailable { get; set; }
  }
}
