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
        /// Get the schema by id (specific version). Exception is thrown if not found
        /// </summary>
        Task<Schema> GetSchemaById(string id);

        /// <summary>
        /// Get schema by id (specific version). If not found return null
        /// </summary>
        Task<Schema?> GetSchemaByIdOrNull(string id);

        /// <summary>
        /// Get the latest version of a schema with the specified name. Exception is thrown if not found
        /// </summary>
        Task<Schema> GetSchemaByName(string name);

        /// <summary>
        /// Get the latest version of a schema with the specified name. If not found return null
        /// </summary>
        Task<Schema?> GetSchemaByNameOrNull(string name);

        /// <summary>
        /// Get the credential for the specified tenant / wallet and id
        /// </summary>
        Task<Domain.SSI.Models.Provider.Credential> GetCredentialById(string tenantId, string id);

        /// <summary>
        /// List the credentials for the specified tenant / wallet, with optional pagination
        /// </summary>
        Task<List<Credential>?> ListCredentials(string tenantId, int? start, int? count);

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
        Task<string?> IssueCredential(CredentialIssuanceRequest request);
    }
}
