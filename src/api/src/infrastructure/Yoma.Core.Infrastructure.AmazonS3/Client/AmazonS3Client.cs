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
    public IAmazonS3 NativeClient => _client;

    public AWSS3OptionsBucket AWSS3OptionsBucket => _optionsBucket;

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

      await using var stream = new MemoryStream(file);

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

    public async Task CreateFromFile(string filename, string contentType, string sourceFilePath)
    {
      if (string.IsNullOrWhiteSpace(filename))
        throw new ArgumentNullException(nameof(filename));
      filename = filename.Trim().ToLower();

      if (string.IsNullOrWhiteSpace(contentType))
        throw new ArgumentNullException(nameof(contentType));
      contentType = contentType.Trim();

      if (string.IsNullOrWhiteSpace(sourceFilePath))
        throw new ArgumentNullException(nameof(sourceFilePath));
      sourceFilePath = sourceFilePath.Trim();

      if (!File.Exists(sourceFilePath))
        throw new FileNotFoundException("Source file does not exist", sourceFilePath);

      await using var fileStream = new FileStream(sourceFilePath, FileMode.Open, FileAccess.Read, FileShare.Read);

      var request = new PutObjectRequest
      {
        BucketName = _optionsBucket.BucketName,
        Key = filename,
        InputStream = fileStream,
        ContentType = contentType,
      };

      try
      {
        await _client.PutObjectAsync(request); // override if exists
      }
      catch (AmazonS3Exception ex)
      {
        throw new HttpClientException(ex.StatusCode, $"Failed to upload file '{filename}' from '{sourceFilePath}': {ex.Message}");
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
        await using var memoryStream = new MemoryStream();
        await response.ResponseStream.CopyToAsync(memoryStream);
        return (response.Headers.ContentType, memoryStream.ToArray());
      }
      catch (AmazonS3Exception ex)
      {
        throw new HttpClientException(ex.StatusCode, $"Failed to download S3 object with filename '{filename}': {ex.Message}");
      }
    }

    public async Task<(string ContentType, string TempSourceFile)> DownloadToFile(string filename)
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
        var tempSourceFile = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());

        using var response = await _client.GetObjectAsync(request);
        await using var fileStream = new FileStream(tempSourceFile, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await response.ResponseStream.CopyToAsync(fileStream);
        return (response.Headers.ContentType, tempSourceFile);
      }
      catch (AmazonS3Exception ex)
      {
        throw new HttpClientException(ex.StatusCode, $"Failed to download S3 object with filename '{filename}': {ex.Message}");
      }
    }

    public string GetUrl(string filename, string? filenameFriendly = null, int? urlExpirationInMinutes = null)
    {
      if (string.IsNullOrWhiteSpace(filename))
        throw new ArgumentNullException(nameof(filename));
      filename = filename.Trim().ToLower();

      filenameFriendly = filenameFriendly?.Trim();

      if (urlExpirationInMinutes.HasValue && urlExpirationInMinutes.Value < 1)
        throw new ArgumentOutOfRangeException(nameof(urlExpirationInMinutes), "URL expiration time must be at least 1 minute");

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

      if (!string.IsNullOrEmpty(filenameFriendly))
        request.ResponseHeaderOverrides.ContentDisposition = $"attachment; filename=\"{filenameFriendly}\"";

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
