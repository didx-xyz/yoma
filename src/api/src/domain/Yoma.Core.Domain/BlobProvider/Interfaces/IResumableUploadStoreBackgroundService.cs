namespace Yoma.Core.Domain.BlobProvider.Interfaces
{
  public interface IResumableUploadStoreBackgroundService
  {
    Task ProcessDeletion();
  }
}
