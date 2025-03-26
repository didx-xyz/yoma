using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IBlobService
  {
    BlobObject GetById(Guid id);

    Task<BlobObject> Create(IFormFile file, FileType type, StorageType storageType);

    /// <summary>
    /// Create the blob object only, preserving the tracking record; used for rollbacks
    /// </summary>
    Task<BlobObject> Create(Guid id, IFormFile file);

    Task<IFormFile> Download(Guid id);

    Task<(string OriginalFileName, string ContentType, string TempSourceFile)> DownloadRawToFile(Guid id);

    string GetURL(Guid id, string? filename = null, int? urlExpirationInMinutes = null);

    string GetURL(StorageType storageType, string key, string? filename = null, int? urlExpirationInMinutes = null);

    Task Delete(Guid id);

    /// <summary>
    /// Delete the blob object only; used for rollbacks
    /// </summary>
    Task Delete(BlobObject blobObject);

    Task Archive(Guid id, BlobObject blobObjectReplacement);
  }
}
