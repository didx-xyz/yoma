namespace Yoma.Core.Domain.BlobProvider.Interfaces
{
  public interface IBlobProviderClient
  {
    Task Create(string filename, string contentType, byte[] file);

    Task<(string ContentType, byte[] Data)> Download(string filename);

    string GetUrl(string filename);

    Task Delete(string filename);
  }
}
