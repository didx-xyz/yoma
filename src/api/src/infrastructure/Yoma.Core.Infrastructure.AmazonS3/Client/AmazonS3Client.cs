using Amazon;
using Amazon.Extensions.NETCore.Setup;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Flurl;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Infrastructure.AmazonS3.Models;

namespace Yoma.Core.Infrastructure.AmazonS3.Client
{
  public class AmazonS3Client : IBlobProviderClient
  {
    #region Class Variables
    private readonly StorageType _storageType;
    private readonly AWSS3OptionsBucket _optionsBucket;
    private readonly IAmazonS3 _client;
    #endregion

    #region Constructor
    public AmazonS3Client(StorageType storageType, AWSS3OptionsBucket optionsBucket)
    {
      _storageType = storageType;
      _optionsBucket = optionsBucket;

      var optionsAWS = new AWSOptions
      {
        Region = RegionEndpoint.GetBySystemName(_optionsBucket.Region),
        Credentials = new BasicAWSCredentials(_optionsBucket.AccessKey, _optionsBucket.SecretKey)
      };

      _client = optionsAWS.CreateServiceClient<IAmazonS3>();
    }
    #endregion

    #region Public Members
    public async Task Create(string filename, string contentType, byte[] file)
    {
      if (string.IsNullOrWhiteSpace(filename))
        throw new ArgumentNullException(nameof(filename));
      filename = filename.Trim().ToLower();

      if (string.IsNullOrWhiteSpace(contentType))
        throw new ArgumentNullException(nameof(contentType));
      contentType = contentType.Trim();

      if (file == null || file.Length == 0)
        throw new ArgumentNullException(nameof(file));

      using var stream = new MemoryStream(file);

      var request = new PutObjectRequest
      {
        BucketName = _optionsBucket.BucketName,
        Key = filename,
        InputStream = stream,
        ContentType = contentType,
      };

      try
      {
        await _client.PutObjectAsync(request); //override an object with the same key(filename)
      }
      catch (AmazonS3Exception ex)
      {
        throw new HttpClientException(ex.StatusCode, $"Failed to upload object with filename '{filename}': {ex.Message}");
      }
    }

    public async Task<(string ContentType, byte[] Data)> Download(string filename)
    {
      if (string.IsNullOrWhiteSpace(filename))
        throw new ArgumentNullException(nameof(filename));
      filename = filename.Trim().ToLower();

      var request = new GetObjectRequest
      {
        BucketName = _optionsBucket.BucketName,
        Key = filename
      };

      try
      {
        using var response = await _client.GetObjectAsync(request);
        using var memoryStream = new MemoryStream();
        await response.ResponseStream.CopyToAsync(memoryStream);
        return (response.Headers.ContentType, memoryStream.ToArray());
      }
      catch (AmazonS3Exception ex)
      {
        throw new HttpClientException(ex.StatusCode, $"Failed to download S3 object with filename '{filename}': {ex.Message}");
      }
    }

    public string GetUrl(string filename, int? urlExpirationInMinutes = null)
    {
      if (string.IsNullOrWhiteSpace(filename))
        throw new ArgumentNullException(nameof(filename));
      filename = filename.Trim().ToLower();

      urlExpirationInMinutes ??= _optionsBucket.URLExpirationInMinutes;

      if (_storageType == StorageType.Private && !urlExpirationInMinutes.HasValue)
        throw new InvalidOperationException($"Explicit expiration or '{AWSS3Options.Section}.{nameof(_optionsBucket.URLExpirationInMinutes)}' required for storage type '{_storageType}'");

      var request = new GetPreSignedUrlRequest
      {
        BucketName = _optionsBucket.BucketName,
        Key = filename,
        Verb = HttpVerb.GET,
        Expires = DateTime.UtcNow.AddMinutes(urlExpirationInMinutes ?? 1)
      };

      string url;
      try
      {
        url = _client.GetPreSignedURL(request);
      }
      catch (AmazonS3Exception ex)
      {
        throw new HttpClientException(ex.StatusCode, $"Failed to retrieve URL for S3 object with filename '{filename}': {ex.Message}");
      }

      return urlExpirationInMinutes.HasValue ? url : new Url(url).RemoveQuery();
    }

    public async Task Delete(string filename)
    {
      if (string.IsNullOrWhiteSpace(filename))
        throw new ArgumentNullException(nameof(filename));
      filename = filename.Trim().ToLower();

      var deleteRequest = new DeleteObjectRequest
      {
        BucketName = _optionsBucket.BucketName,
        Key = filename
      };

      try
      {
        await _client.DeleteObjectAsync(deleteRequest);

      }
      catch (AmazonS3Exception ex)
      {
        throw new HttpClientException(ex.StatusCode, $"Failed to delete S3 object with filename '{filename}': {ex.Message}");
      }
    }
    #endregion
  }
}
