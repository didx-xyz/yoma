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
        /// Find and return the latest version of a schema with the specified name. Exception is thrown if not found
        /// </summary>
        Task<Schema> GetSchemaByName(string name);

        /// <summary>
        /// Find and return the latest version of a schema with the specified name. If not found return null
        /// </summary>
        Task<Schema?> GetSchemaByNameOrNull(string name);

        /// <summary>
        /// Create a new schema with the specified name and attributes. If a schema with the same name already exists, a new version will automatically be created
        /// </summary>
        Task<Schema> UpsertSchema(SchemaRequest request);

        /// <summary>
        /// Ensure the tenant for the specified request
        /// </summary>
        Task<string> EnsureTenant(TenantRequest request);

        /// <summary>
        /// Issue credential for the specified request
        /// </summary>
        Task<string> IssueCredential(CredentialIssuanceRequest request);
    }
}
