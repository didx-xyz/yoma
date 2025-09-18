namespace Yoma.Core.Domain.BlobProvider.Interfaces
{
  public interface IBlobProviderClient
  {
    Task Create(string filename, string contentType, byte[] file);

    Task Create(string filename, string contentType, string sourceBucket, string sourceFilename);

    Task CreateFromFile(string filename, string contentType, string sourceFilePath);

    Task<(string ContentType, byte[] Data)> Download(string filename);

    Task<(string ContentType, string TempSourceFile)> DownloadToFile(string filename);

    string GetUrl(string filename, string? filenameFriendly = null, int? urlExpirationInMinutes = null);

    Task Delete(string filename);
  }
}
