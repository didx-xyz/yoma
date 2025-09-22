using Yoma.Core.Domain.BlobProvider.Models;

namespace Yoma.Core.Domain.BlobProvider.Interfaces
{
  public interface IResumableUploadStore
  {
    Task Delete(string uploadId);

    Task<IReadOnlyList<string>> ListPendingDeletion(int batchSize, List<string> uploadIdsToSkip);

    Task<ResumableUploadInfo> GetInfo(string uploadId);
  }
}
