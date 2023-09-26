using Yoma.Core.Domain.SSI.Models.Provider;

namespace Yoma.Core.Domain.SSI.Interfaces.Provider
{
    public interface ISSIProviderClient
    {
        /// <summary>
        /// Return a list of configured schemas for the client. Optionally only return the latest versions
        /// </summary>
        Task<List<Schema>?> ListSchemas(bool latestVersion);

        /// <summary>
        /// Find and return the latest version of a schema with the specified name
        /// </summary>
        Task<Schema?> GetByName(string name);

        /// <summary>
        /// Create a new schema with the specified name and attributes. If a schema with the same name already exists, a new version will automatically be created
        /// </summary>
        Task<Schema> Create(SchemaRequest request);
    }
}
