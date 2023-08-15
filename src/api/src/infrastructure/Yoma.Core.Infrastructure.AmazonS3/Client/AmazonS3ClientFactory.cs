using Amazon.S3;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Infrastructure.AmazonS3.Models;

namespace Yoma.Core.Infrastructure.AmazonS3.Client
{
  public class AmazonS3ClientFactory : IBlobProviderClientFactory
  {
    #region Class Variables
    private readonly IAmazonS3 _client;
    private readonly AWSS3Options _options;
    #endregion

    #region Constructor
    public AmazonS3ClientFactory(IAmazonS3 client, IOptions<AWSS3Options> options)
    {
      _client = client;
      _options = options.Value;
    }
    #endregion

    #region Public Members
    public IBlobProviderClient CreateClient()
    {
      return new AmazonS3Client(_client, _options);
    }
    #endregion
  }
}
