using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;
using System.Text;
using tusdotnet.Stores.S3;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Domain.BlobProvider.Models;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.AmazonS3.Models;

namespace Yoma.Core.Infrastructure.AmazonS3.Services
{
  public sealed class TusResumableUploadStoreService : IResumableUploadStore
  {
    #region Class Variables
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AWSS3Options _options;
    private readonly TusS3Store _tusStore;
    private static readonly FileExtensionContentTypeProvider _fileExtensionContentTypeProvider = new();
    private const string DefaultContentType = "application/octet-stream";
    #endregion

    #region Constructor
    public TusResumableUploadStoreService(IEnvironmentProvider environmentProvider, IOptions<AWSS3Options> options, TusS3Store tusStore)
    {
      _environmentProvider = environmentProvider ?? throw new ArgumentNullException(nameof(environmentProvider));
      _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
      _tusStore = tusStore ?? throw new ArgumentNullException(nameof(tusStore));
    }
    #endregion

    #region Public Members
    public async Task Delete(string uploadId)
    {
      if (string.IsNullOrWhiteSpace(uploadId))
        throw new ArgumentNullException(nameof(uploadId));
      uploadId = uploadId.Trim();

      await _tusStore.DeleteFileAsync(uploadId, CancellationToken.None);
    }

    /// <summary>
    /// Lists upload IDs that are safe to delete (expired and incomplete).
    ///
    /// Why this exists:
    /// - Tus does not automatically remove expired uploads in S3.
    /// - Without cleanup, incomplete uploads accumulate indefinitely, wasting storage.
    /// - This method is used by the background job to fetch candidates for deletion
    ///   in manageable batches. Uploads that fail deletion in the same run can be skipped
    ///   and retried in the next scheduled job.
    /// 
    /// Scope:
    /// - Targets only **expired, incomplete uploads** as determined by Tus.
    /// - Does not touch completed uploads, even if the user never submitted the related request.
    /// 
    /// Completed but abandoned uploads:
    /// - For uploads that are marked complete in Tus but never processed by the app,
    ///   we rely on **S3 lifecycle rules** configured per environment (local, development,
    ///   staging, production).
    /// - These rules delete both `files/` and `upload-info/` objects after 1 day,
    ///   acting as a safety net without requiring database infrastructure to track them.
    /// 
    /// Combined:
    /// - This service = proactive cleanup of expired + incomplete uploads.
    /// - Lifecycle rules = fallback cleanup for completed-but-abandoned uploads.
    /// </summary>
    public async Task<IReadOnlyList<string>> ListPendingDeletion(int batchSize, List<string> uploadIdsToSkip)
    {
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(batchSize, 0, nameof(batchSize));

      var results = await _tusStore.GetExpiredFilesAsync(CancellationToken.None);

      if (uploadIdsToSkip.Count > 0) results = results.Where(id => !uploadIdsToSkip.Contains(id));

      return [.. results.Take(batchSize)];
    }

    public async Task<ResumableUploadInfo> GetInfo(string uploadId)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(uploadId);

      var file = await _tusStore.GetFileAsync(uploadId, CancellationToken.None) ?? throw new EntityNotFoundException($"Resumable upload '{uploadId}' not found");
      var metadata = await file.GetMetadataAsync(CancellationToken.None);

      if (!metadata.TryGetValue("filename", out var filenameMeta))
        throw new InvalidOperationException($"Resumable upload '{uploadId}' is missing 'filename' metadata");

      var fileName = filenameMeta.GetString(Encoding.UTF8)?.Trim();
      if (string.IsNullOrWhiteSpace(fileName))
        throw new InvalidOperationException($"Resumable upload '{uploadId}' has an invalid filename");

      var uploadLength = await _tusStore.GetUploadLengthAsync(uploadId, CancellationToken.None);
      var uploadOffset = await _tusStore.GetUploadOffsetAsync(uploadId, CancellationToken.None);
      if (uploadLength is null || uploadOffset != uploadLength.Value)
        throw new InvalidOperationException($"Resumable upload '{uploadId}' is not complete");

      // Extract extension
      var extension = Path.GetExtension(fileName)?.Trim();
      if (string.IsNullOrWhiteSpace(extension))
        throw new InvalidOperationException($"Resumable upload '{uploadId}' has no valid file extension");

      // Skip expiration check for completed uploads.
      // In tus, Expires only applies to incomplete uploads (cleaned by Yoma job).
      // Completed uploads remain until S3 lifecycle (1 day) deletes them.
      // If they’re gone, the file existence check will reject the request,
      // meaning they are implicitly expired if not submitted in time.

      // Determine ContentType: prefer metadata, otherwise guess from extension
      string? contentType = null;
      if (metadata.TryGetValue("contentType", out var ctMeta))
        contentType = ctMeta.GetString(Encoding.UTF8)?.Trim();

      if (string.IsNullOrWhiteSpace(contentType))
      {
        if (!_fileExtensionContentTypeProvider.TryGetContentType(fileName, out contentType))
          contentType = DefaultContentType;
      }

      if (!_options.Buckets.TryGetValue(StorageType.Private, out var optionsBucket) || optionsBucket == null)
        throw new InvalidOperationException($"Failed to retrieve configuration section '{AWSS3Options.Section}' for storage type '{StorageType.Private}'");

      return new ResumableUploadInfo
      {
        UploadId = uploadId,
        OriginalFileName = fileName,
        Extension = extension,
        ContentType = contentType,
        Length = uploadLength.Value,
        SourceBucket = optionsBucket.BucketName,
        SourceKey = $"{_environmentProvider.Environment}/{_options.Tus.KeyPrefix}/files/{uploadId}".ToLower()
      };
    }
    #endregion
  }
}
