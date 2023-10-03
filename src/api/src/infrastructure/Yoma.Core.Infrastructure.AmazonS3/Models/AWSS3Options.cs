using Yoma.Core.Domain.BlobProvider;

namespace Yoma.Core.Infrastructure.AmazonS3.Models
{
    public class AWSS3Options
    {
        public const string Section = "AWSS3";

        public Dictionary<StorageType, AWSS3OptionsBucket> Buckets { get; set; }
    }

    public class AWSS3OptionsBucket
    {
        public string Region { get; set; }

        public string AccessKey { get; set; }

        public string SecretKey { get; set; }

        public string BucketName { get; set; }

        public int? URLExpirationInMinutes { get; set; }
    }
}
