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
