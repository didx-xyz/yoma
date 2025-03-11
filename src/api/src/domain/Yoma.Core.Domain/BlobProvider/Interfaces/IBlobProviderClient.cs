namespace Yoma.Core.Domain.BlobProvider.Interfaces
{
  public interface IBlobProviderClient
  {
    Task Create(string filename, string contentType, byte[] file);

    Task<(string ContentType, byte[] Data)> Download(string filename);

    string GetUrl(string filename, string? filenameFriendly = null, int? urlExpirationInMinutes = null);

    Task Delete(string filename);
  }
}
