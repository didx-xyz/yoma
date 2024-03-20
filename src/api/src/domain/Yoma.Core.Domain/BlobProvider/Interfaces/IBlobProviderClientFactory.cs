namespace Yoma.Core.Domain.BlobProvider.Interfaces
{
  public interface IBlobProviderClientFactory
  {
    IBlobProviderClient CreateClient(StorageType storageType);
  }
}
