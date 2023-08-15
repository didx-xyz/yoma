namespace Yoma.Core.Domain.BlobProvider.Interfaces
{
  public interface IBlobProviderClient
  {
    Task Create(string key, string contentType, byte[] file);

    string GetUrl(string key);

    Task Delete(string key);
  }
}
