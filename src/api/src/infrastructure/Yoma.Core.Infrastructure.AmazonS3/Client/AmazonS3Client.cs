using Amazon.S3;
using Amazon.S3.Model;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Infrastructure.AmazonS3.Models;

namespace Yoma.Core.Infrastructure.AmazonS3.Client
{
    public class AmazonS3Client : IBlobProviderClient
    {
        #region Class Variables
        private readonly IAmazonS3 _client;
        private readonly AWSS3Options _options;
        #endregion

        #region Constructor
        public AmazonS3Client(IAmazonS3 client, AWSS3Options options)
        {
            _client = client;
            _options = options;
        }
        #endregion

        #region Public Members
        public async Task Create(string key, string contentType, byte[] file)
        {
            if (string.IsNullOrWhiteSpace(key))
                throw new ArgumentNullException(nameof(key));
            key = key.Trim().ToLower();

            if (string.IsNullOrWhiteSpace(contentType))
                throw new ArgumentNullException(nameof(contentType));
            contentType = contentType.Trim();

            if (file == null || file.Length == 0)
                throw new ArgumentNullException(nameof(file));

            using var stream = new MemoryStream(file);

            var request = new PutObjectRequest
            {
                BucketName = _options.BucketName,
                Key = key,
                InputStream = stream,
                ContentType = contentType
            };

            try
            {
                await _client.PutObjectAsync(request);
            }
            catch (AmazonS3Exception ex)
            {
                throw new HttpClientException(ex.StatusCode, $"Failed to upload object with key '{key}': {ex.Message}");
            }
        }

        public string GetUrl(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
                throw new ArgumentNullException(nameof(key));
            key = key.Trim().ToLower();

            var request = new GetPreSignedUrlRequest
            {
                BucketName = _options.BucketName,
                Key = key,
                Verb = HttpVerb.GET,
                Expires = DateTime.UtcNow.AddMinutes(_options.URLExpirationInMinutes)
            };

            try
            {
                return _client.GetPreSignedURL(request);
            }
            catch (AmazonS3Exception ex)
            {
                throw new HttpClientException(ex.StatusCode, $"Failed to retrieve URL for S3 object with key '{key}': {ex.Message}");
            }
        }

        public async Task Delete(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
                throw new ArgumentNullException(nameof(key));
            key = key.Trim().ToLower();

            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = _options.BucketName,
                Key = key
            };

            try
            {
                await _client.DeleteObjectAsync(deleteRequest);

            }
            catch (AmazonS3Exception ex)
            {
                throw new HttpClientException(ex.StatusCode, $"Failed to delete S3 object with key '{key}': {ex.Message}");
            }
        }
        #endregion
    }
}
