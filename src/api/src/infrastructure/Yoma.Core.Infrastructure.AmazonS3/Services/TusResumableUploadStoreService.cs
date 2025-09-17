using tusdotnet.Stores.S3;
using Yoma.Core.Domain.BlobProvider.Interfaces;

namespace Yoma.Core.Infrastructure.AmazonS3.Services
{
  public sealed class TusResumableUploadStoreService : IResumableUploadStore
  {
    #region Class Variables
    private readonly TusS3Store _tusStore;
    #endregion

    #region Constructor
    public TusResumableUploadStoreService(TusS3Store tusStore)
    {
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
    #endregion
  }
}
