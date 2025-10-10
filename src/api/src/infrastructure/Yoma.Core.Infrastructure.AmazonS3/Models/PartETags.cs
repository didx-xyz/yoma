using Amazon.S3.Model;

namespace Yoma.Core.Infrastructure.AmazonS3.Models
{
  internal class PartETags
  {
    public List<PartETag> Tags  { get; set; } = [];
  }
}
