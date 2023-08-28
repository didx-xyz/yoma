namespace Yoma.Core.Domain.BlobProvider.Interfaces
{
    public interface IBlobProviderClient
    {
        Task Create(string key, string contentType, byte[] file);

        Task<(string ContentType, byte[] Data)> Download(string key);

        string GetUrl(string key);

        Task Delete(string key);
    }
}
