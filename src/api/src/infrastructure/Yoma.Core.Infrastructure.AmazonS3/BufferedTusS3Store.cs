// ---------------------------------------------------------------------------------------------
// BufferedTusS3Store
// ---------------------------------------------------------------------------------------------
// Custom TUS store implementation using AWS S3 SDK directly.
// Buffers incoming PATCH requests in Valkey until >=5 MB is accumulated, then flushes to S3.
// Prevents AWS multipart uploads from failing due to parts smaller than 5 MB.
// Handles both small files (≤5MB) and large files (>5MB) with multipart uploads.
// ---------------------------------------------------------------------------------------------

using Microsoft.Extensions.Logging;
using System.Buffers;
using System.Text;
using tusdotnet.Interfaces;
using tusdotnet.Models;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Amazon.S3;
using Amazon.S3.Model;

namespace Yoma.Core.Infrastructure.AmazonS3
{
  public sealed class BufferedTusS3Store :
      ITusStore,
      ITusCreationStore,
      ITusReadableStore,
      ITusTerminationStore,
      ITusExpirationStore
  {
    #region Vars
    private readonly ILogger<BufferedTusS3Store> _logger;
    private readonly IDistributedCacheService _cache;
    private readonly IDistributedLockService _distLock;
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string _filePrefix;
    private readonly string _metadataPrefix;
    private readonly int _minPartSize;
    private readonly TimeSpan _expiration;
    private readonly TimeSpan _bufTtl;
    
    private const int DefaultReadEnvelope = 1 * 1024 * 1024; // 1 MB
    
    // Cache helper classes
    private class UploadMetadata 
    { 
      public long UploadLength { get; set; }
      public Dictionary<string, string> Metadata { get; set; } = [];
      public DateTimeOffset Expires { get; set; }
      public string? MultipartUploadId { get; set; } // S3 multipart upload ID
    }
    private class CommittedOffset { public long Value { get; set; } }
    private class PartETags { public List<PartETag> Tags { get; set; } = []; }
    #endregion

    #region Ctor
    public BufferedTusS3Store(
        ILogger<BufferedTusS3Store> logger,
        IDistributedCacheService cache,
        IDistributedLockService distLock,
        IAmazonS3 s3Client,
        string bucketName,
        string filePrefix,
        string metadataPrefix,
        int minPartSizeBytes,
        int expirationMinutes)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _cache = cache ?? throw new ArgumentNullException(nameof(cache));
      _distLock = distLock ?? throw new ArgumentNullException(nameof(distLock));
      _s3Client = s3Client ?? throw new ArgumentNullException(nameof(s3Client));
      _bucketName = bucketName ?? throw new ArgumentNullException(nameof(bucketName));
      _filePrefix = filePrefix ?? throw new ArgumentNullException(nameof(filePrefix));
      _metadataPrefix = metadataPrefix ?? throw new ArgumentNullException(nameof(metadataPrefix));
      
      if (minPartSizeBytes < 5 * 1024 * 1024)
        throw new ArgumentException("Minimum part size must be at least 5 MB", nameof(minPartSizeBytes));
      
      _minPartSize = minPartSizeBytes;
      _expiration = TimeSpan.FromMinutes(expirationMinutes);
      _bufTtl = TimeSpan.FromMinutes(expirationMinutes + 10);
      
      _logger.LogInformation("BufferedTusS3Store initialized: bucket={Bucket}, minPart={MinPart}MB, expiration={Expiration}min",
        _bucketName, _minPartSize / 1024 / 1024, expirationMinutes);
    }
    #endregion

    #region Cache Keys
    private static string MetadataKey(string fileId) => CacheHelper.GenerateKey<BufferedTusS3Store>(fileId, "meta");
    private static string BufferKey(string fileId) => CacheHelper.GenerateKey<BufferedTusS3Store>(fileId, "buf");
    private static string CommittedKey(string fileId) => CacheHelper.GenerateKey<BufferedTusS3Store>(fileId, "committed");
    private static string ETagsKey(string fileId) => CacheHelper.GenerateKey<BufferedTusS3Store>(fileId, "etags");
    private static string LockKey(string fileId) => CacheHelper.GenerateKey<BufferedTusS3Store>(fileId, "lock");
    private string S3FileKey(string fileId) => $"{_filePrefix}{fileId}";
    private string S3MetadataKey(string fileId) => $"{_metadataPrefix}{fileId}";
    #endregion

    #region ITusCreationStore
    public async Task<string> CreateFileAsync(long uploadLength, string metadata, CancellationToken ct)
    {
      var fileId = Guid.NewGuid().ToString("N");
      var meta = ParseMetadata(metadata);
      
      var uploadMeta = new UploadMetadata
      {
        UploadLength = uploadLength,
        Metadata = meta,
        Expires = DateTimeOffset.UtcNow.Add(_expiration)
      };
      
      // Store metadata in cache
      await _cache.SetAsync(MetadataKey(fileId), uploadMeta, _bufTtl);
      await _cache.SetAsync(BufferKey(fileId), Array.Empty<byte>(), _bufTtl);
      await _cache.SetAsync(CommittedKey(fileId), new CommittedOffset { Value = 0 }, _bufTtl);
      await _cache.SetAsync(ETagsKey(fileId), new PartETags(), _bufTtl);
      
      // Also store in S3 for expiration tracking
      await _s3Client.PutObjectAsync(new PutObjectRequest
      {
        BucketName = _bucketName,
        Key = S3MetadataKey(fileId),
        ContentBody = System.Text.Json.JsonSerializer.Serialize(uploadMeta),
        ContentType = "application/json",
        Metadata =
        {
          ["tus-upload-length"] = uploadLength.ToString(),
          ["tus-expires"] = uploadMeta.Expires.ToString("O")
        }
      }, ct);
      
      _logger.LogDebug("Created upload: fileId={FileId}, length={Length}, expires={Expires}", 
        fileId, uploadLength, uploadMeta.Expires);
      
      return fileId;
    }

    public async Task<string> GetUploadMetadataAsync(string fileId, CancellationToken ct)
    {
      var meta = await _cache.GetAsync<UploadMetadata>(MetadataKey(fileId));
      if (meta == null) return string.Empty;
      
      return string.Join(",", meta.Metadata.Select(kv => $"{kv.Key} {Convert.ToBase64String(Encoding.UTF8.GetBytes(kv.Value))}"));
    }
    #endregion

    #region ITusReadableStore
    public async Task<ITusFile?> GetFileAsync(string fileId, CancellationToken ct)
    {
      var meta = await _cache.GetAsync<UploadMetadata>(MetadataKey(fileId));
      if (meta == null) return null;
      
      return new TusS3File(fileId, meta.Metadata, _s3Client, _bucketName, S3FileKey(fileId));
    }
    #endregion

    #region ITusExpirationStore
    public async Task<IEnumerable<string>> GetExpiredFilesAsync(CancellationToken ct)
    {
      var now = DateTimeOffset.UtcNow;
      var expired = new List<string>();
      
      // List all metadata objects in S3
      var request = new ListObjectsV2Request
      {
        BucketName = _bucketName,
        Prefix = _metadataPrefix
      };
      
      ListObjectsV2Response response;
      do
      {
        response = await _s3Client.ListObjectsV2Async(request, ct);
        
        foreach (var obj in response.S3Objects)
        {
          var fileId = obj.Key[_metadataPrefix.Length..];
          
          // Check if expired via metadata
          var headResponse = await _s3Client.GetObjectMetadataAsync(_bucketName, obj.Key, ct);
          if (headResponse.Metadata["x-amz-meta-tus-expires"] is string expiresStr &&
              DateTimeOffset.TryParse(expiresStr, out var expires) &&
              expires < now)
          {
            expired.Add(fileId);
          }
        }
        
        request.ContinuationToken = response.NextContinuationToken;
      }
      while (response.IsTruncated == true);
      
      return expired;
    }

    public async Task<int> RemoveExpiredFilesAsync(CancellationToken ct)
    {
      var expired = await GetExpiredFilesAsync(ct);
      var count = 0;
      
      foreach (var fileId in expired)
      {
        try
        {
          await DeleteFileAsync(fileId, ct);
          count++;
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Failed to delete expired file: {FileId}", fileId);
        }
      }
      
      return count;
    }

    public async Task SetExpirationAsync(string fileId, DateTimeOffset expires, CancellationToken ct)
    {
      var meta = await _cache.GetAsync<UploadMetadata>(MetadataKey(fileId));
      if (meta == null) return;
      
      meta.Expires = expires;
      await _cache.SetAsync(MetadataKey(fileId), meta, _bufTtl);
      
      // Update S3 metadata
      await _s3Client.CopyObjectAsync(new CopyObjectRequest
      {
        SourceBucket = _bucketName,
        SourceKey = S3MetadataKey(fileId),
        DestinationBucket = _bucketName,
        DestinationKey = S3MetadataKey(fileId),
        MetadataDirective = S3MetadataDirective.REPLACE,
        Metadata =
        {
          ["tus-expires"] = expires.ToString("O")
        }
      }, ct);
    }

    public async Task<DateTimeOffset?> GetExpirationAsync(string fileId, CancellationToken ct)
    {
      var meta = await _cache.GetAsync<UploadMetadata>(MetadataKey(fileId));
      return meta?.Expires;
    }
    #endregion

    #region Core Methods
    public async Task<bool> FileExistAsync(string fileId, CancellationToken ct)
    {
      var meta = await _cache.GetAsync<UploadMetadata>(MetadataKey(fileId));
      return meta != null;
    }

    public async Task<long?> GetUploadLengthAsync(string fileId, CancellationToken ct)
    {
      var meta = await _cache.GetAsync<UploadMetadata>(MetadataKey(fileId));
      return meta?.UploadLength;
    }

    public async Task<long> GetUploadOffsetAsync(string fileId, CancellationToken ct)
    {
      var committedObj = await _cache.GetAsync<CommittedOffset>(CommittedKey(fileId));
      var committed = committedObj?.Value ?? 0;
      
      var buf = await _cache.GetAsync<byte[]>(BufferKey(fileId)) ?? [];
      var buffered = buf.LongLength;
      
      var totalLen = await GetUploadLengthAsync(fileId, ct);
      var offset = totalLen.HasValue ? Math.Min(committed + buffered, totalLen.Value) : committed + buffered;
      
      _logger.LogDebug("GetUploadOffset: fileId={FileId}, committed={Committed}, buffered={Buffered}, total={Total}",
        fileId, committed, buffered, offset);
      
      return offset;
    }

    public async Task<long> AppendDataAsync(string fileId, Stream stream, CancellationToken ct)
    {
      return await _distLock.RunWithLockAsync(LockKey(fileId), TimeSpan.FromSeconds(30), async () =>
      {
        var meta = await _cache.GetAsync<UploadMetadata>(MetadataKey(fileId)) ?? throw new InvalidOperationException($"Upload metadata not found for fileId={fileId}");
        var committedObj = await _cache.GetAsync<CommittedOffset>(CommittedKey(fileId));
        var committed = committedObj?.Value ?? 0;
        
        // Load buffered remainder
        var remainder = await _cache.GetAsync<byte[]>(BufferKey(fileId)) ?? [];
        var remLen = remainder.Length;
        
        if (remLen == 0)
          await _cache.RemoveAsync(BufferKey(fileId));
        
        long totalRead = 0;
        var readBufferSize = Math.Max(DefaultReadEnvelope, Math.Min(_minPartSize, 4 * 1024 * 1024));
        var readBuf = ArrayPool<byte>.Shared.Rent(readBufferSize);
        
        try
        {
          // Read ALL data from stream first
          using var ms = new MemoryStream();
          await stream.CopyToAsync(ms, ct);
          var incomingData = ms.ToArray();
          totalRead = incomingData.Length;
          
          if (totalRead == 0)
          {
            return 0;
          }
          
          // Combine with remainder
          byte[] allData;
          if (remLen > 0)
          {
            allData = new byte[remLen + totalRead];
            Buffer.BlockCopy(remainder, 0, allData, 0, remLen);
            Buffer.BlockCopy(incomingData, 0, allData, remLen, (int)totalRead);
          }
          else
          {
            allData = incomingData;
          }
          
          var totalAvailable = allData.Length;
          var processed = 0;
          
          // Flush full 5MB parts
          while (totalAvailable - processed >= _minPartSize && committed + _minPartSize <= meta.UploadLength)
          {
            await FlushPartAsync(fileId, allData, _minPartSize, meta, committed, ct, processed);
            committed += _minPartSize;
            processed += _minPartSize;
          }
          
          // Handle remaining data
          var remaining = totalAvailable - processed;
          
          if (remaining > 0)
          {
            // Check if this completes the upload
            if (committed + remaining == meta.UploadLength)
            {
              var finalData = new byte[remaining];
              Buffer.BlockCopy(allData, processed, finalData, 0, remaining);
              
              committed = await FlushFinalAsync(fileId, finalData, remaining, meta, committed, ct);
              await CleanupAsync(fileId);
              
              _logger.LogInformation("Upload complete: fileId={FileId}, totalSize={TotalSize}",
                fileId, committed);
            }
            else
            {
              // Cache remainder for next PATCH
              var newRemainder = new byte[remaining];
              Buffer.BlockCopy(allData, processed, newRemainder, 0, remaining);
              await _cache.SetAsync(BufferKey(fileId), newRemainder, _bufTtl);
            }
          }
          else
          {
            await _cache.RemoveAsync(BufferKey(fileId));
          }
          
          return totalRead;
        }
        finally
        {
          ArrayPool<byte>.Shared.Return(readBuf);
        }
      });
    }

    public async Task DeleteFileAsync(string fileId, CancellationToken ct)
    {
      try
      {
        // Abort multipart upload if exists
        var meta = await _cache.GetAsync<UploadMetadata>(MetadataKey(fileId));
        if (meta?.MultipartUploadId != null)
        {
          await _s3Client.AbortMultipartUploadAsync(new AbortMultipartUploadRequest
          {
            BucketName = _bucketName,
            Key = S3FileKey(fileId),
            UploadId = meta.MultipartUploadId
          }, ct);
        }
        
        // Delete file object
        await _s3Client.DeleteObjectAsync(_bucketName, S3FileKey(fileId), ct);
        
        // Delete metadata object
        await _s3Client.DeleteObjectAsync(_bucketName, S3MetadataKey(fileId), ct);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to delete S3 objects for fileId={FileId}", fileId);
      }
      
      await CleanupAsync(fileId);
      _logger.LogDebug("Deleted file: {FileId}", fileId);
    }
    #endregion

    #region Private Helpers
    private async Task FlushPartAsync(string fileId, byte[] data, int size, UploadMetadata meta, long currentCommitted, CancellationToken ct, int offset = 0)
    {
      // Initiate multipart upload if needed
      if (meta.MultipartUploadId == null)
      {
        var initResponse = await _s3Client.InitiateMultipartUploadAsync(new InitiateMultipartUploadRequest
        {
          BucketName = _bucketName,
          Key = S3FileKey(fileId),
          ContentType = "application/octet-stream"
        }, ct);
        
        meta.MultipartUploadId = initResponse.UploadId;
        await _cache.SetAsync(MetadataKey(fileId), meta, _bufTtl);
        
        _logger.LogInformation("Initiated multipart upload: fileId={FileId}, uploadId={UploadId}",
          fileId, meta.MultipartUploadId);
      }
      
      // Upload part
      var etags = await _cache.GetAsync<PartETags>(ETagsKey(fileId)) ?? new PartETags();
      var partNumber = etags.Tags.Count + 1;
      
      using var partStream = new MemoryStream(data, offset, size, writable: false);
      
      var uploadResponse = await _s3Client.UploadPartAsync(new UploadPartRequest
      {
        BucketName = _bucketName,
        Key = S3FileKey(fileId),
        UploadId = meta.MultipartUploadId,
        PartNumber = partNumber,
        InputStream = partStream,
        PartSize = size
      }, ct);
      
      etags.Tags.Add(new PartETag(partNumber, uploadResponse.ETag));
      await _cache.SetAsync(ETagsKey(fileId), etags, _bufTtl);
      
      var newCommitted = currentCommitted + size;
      await _cache.SetAsync(CommittedKey(fileId), new CommittedOffset { Value = newCommitted }, _bufTtl);
      
      // CRITICAL: Clear buffer cache after flushing to prevent double-counting in GetUploadOffsetAsync
      await _cache.RemoveAsync(BufferKey(fileId));
      
      _logger.LogInformation("Uploaded part {PartNum}: {Size} bytes, committed={Committed}",
        partNumber, size, newCommitted);
      
      return;
    }

    private async Task<long> FlushFinalAsync(string fileId, byte[] data, int size, UploadMetadata meta, long currentCommitted, CancellationToken ct)
    {
      if (meta.MultipartUploadId != null)
      {
        // Upload final part and complete multipart
        var etags = await _cache.GetAsync<PartETags>(ETagsKey(fileId)) ?? new PartETags();
        var partNumber = etags.Tags.Count + 1;
        
        using var partStream = new MemoryStream(data, 0, size, writable: false);
        
        var uploadResponse = await _s3Client.UploadPartAsync(new UploadPartRequest
        {
          BucketName = _bucketName,
          Key = S3FileKey(fileId),
          UploadId = meta.MultipartUploadId,
          PartNumber = partNumber,
          InputStream = partStream,
          PartSize = size
        }, ct);
        
        etags.Tags.Add(new PartETag(partNumber, uploadResponse.ETag));
        
        // Complete multipart upload
        await _s3Client.CompleteMultipartUploadAsync(new CompleteMultipartUploadRequest
        {
          BucketName = _bucketName,
          Key = S3FileKey(fileId),
          UploadId = meta.MultipartUploadId,
          PartETags = etags.Tags
        }, ct);
        
        _logger.LogInformation("Completed multipart upload: fileId={FileId}, parts={Parts}",
          fileId, etags.Tags.Count);
      }
      else
      {
        // Small file - use PutObject
        using var fileStream = new MemoryStream(data, 0, size, writable: false);
        
        await _s3Client.PutObjectAsync(new PutObjectRequest
        {
          BucketName = _bucketName,
          Key = S3FileKey(fileId),
          InputStream = fileStream,
          ContentType = "application/octet-stream"
        }, ct);
        
        _logger.LogInformation("Uploaded small file: fileId={FileId}, size={Size}", fileId, size);
      }
      
      var newCommitted = currentCommitted + size;
      await _cache.SetAsync(CommittedKey(fileId), new CommittedOffset { Value = newCommitted }, _bufTtl);
      
      return newCommitted;
    }

    private async Task CleanupAsync(string fileId)
    {
      try
      {
        await _cache.RemoveAsync(BufferKey(fileId));
        await _cache.RemoveAsync(CommittedKey(fileId));
        await _cache.RemoveAsync(ETagsKey(fileId));
        // Keep metadata for GetInfo
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to clean cache for fileId={FileId}", fileId);
      }
    }

    private static Dictionary<string, string> ParseMetadata(string metadata)
    {
      var result = new Dictionary<string, string>();
      if (string.IsNullOrWhiteSpace(metadata)) return result;
      
      foreach (var pair in metadata.Split(','))
      {
        var parts = pair.Trim().Split(' ', 2);
        if (parts.Length == 2)
        {
          try
          {
            result[parts[0]] = Encoding.UTF8.GetString(Convert.FromBase64String(parts[1]));
          }
          catch { /* Ignore invalid metadata */ }
        }
      }
      
      return result;
    }
    #endregion
  }

  // Simple ITusFile implementation that doesn't rely on tusdotnet's Metadata type
  internal class TusS3File(string fileId, Dictionary<string, string> rawMetadata, IAmazonS3 s3Client, string bucketName, string key) : ITusFile
  {
    public string Id => fileId;

    public Task<Dictionary<string, Metadata>> GetMetadataAsync(CancellationToken cancellationToken)
    {
      // Create Metadata objects using the internal tusdotnet API
      // Metadata is essentially IReadOnlyDictionary<string, ReadOnlyMemory<byte>>
      var result = new Dictionary<string, Metadata>();
      
      foreach (var kv in rawMetadata)
      {
        var bytes = Encoding.UTF8.GetBytes(kv.Value);
        var memory = new ReadOnlyMemory<byte>(bytes);
        
        // Use reflection to create Metadata since constructors aren't public
        var metadataType = typeof(Metadata);
        var internalDict = new Dictionary<string, ReadOnlyMemory<byte>> { { string.Empty, memory } };
        
        // Metadata has an internal constructor that takes IReadOnlyDictionary
        var constructor = metadataType.GetConstructors(System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)[0];
        var metadata = (Metadata)constructor.Invoke([internalDict]);
        
        result[kv.Key] = metadata;
      }
      
      return Task.FromResult(result);
    }

    public async Task<Stream> GetContentAsync(CancellationToken cancellationToken)
    {
      var response = await s3Client.GetObjectAsync(bucketName, key, cancellationToken);
      return response.ResponseStream;
    }
  }
}
