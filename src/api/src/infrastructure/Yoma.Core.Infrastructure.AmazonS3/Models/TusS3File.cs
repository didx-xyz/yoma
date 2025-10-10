using System.Text;
using tusdotnet.Interfaces;
using tusdotnet.Models;
using Amazon.S3;

namespace Yoma.Core.Infrastructure.AmazonS3.Models
{
  // Simple ITusFile implementation 
  internal class TusS3File(string fileId, Dictionary<string, string> rawMetadata, IAmazonS3 s3Client, string bucketName, string key) : ITusFile
  {
    public string Id => fileId;

    public Task<Dictionary<string, Metadata>> GetMetadataAsync(CancellationToken cancellationToken)
    {
      // The rawMetadata already has decoded string values like {"filename": "tus_test.zip"}
      // We need to convert these to tusdotnet's Metadata type
      // Build the metadata string in TUS format: "key1 base64value1,key2 base64value2"

      var metadataStrings = rawMetadata.Select(kv =>
      {
        var valueBytes = Encoding.UTF8.GetBytes(kv.Value);
        var base64Value = Convert.ToBase64String(valueBytes);
        return $"{kv.Key} {base64Value}";
      });

      var combinedMetadata = string.Join(",", metadataStrings);

      // Use Metadata.Parse to create the dictionary properly
      var result = Metadata.Parse(combinedMetadata);

      return Task.FromResult(result);
    }

    public async Task<Stream> GetContentAsync(CancellationToken cancellationToken)
    {
      var response = await s3Client.GetObjectAsync(bucketName, key, cancellationToken);
      return response.ResponseStream;
    }
  }
}
