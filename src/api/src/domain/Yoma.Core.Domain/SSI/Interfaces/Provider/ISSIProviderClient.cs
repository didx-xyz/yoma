using Yoma.Core.Domain.SSI.Models.Provider;

namespace Yoma.Core.Domain.SSI.Interfaces.Provider
{
    public interface ISSIProviderClient
    {
        /// <summary>
        /// Return a list of configured schemas for the client
        /// </summary>
        Task<List<Schema>> ListSchemas();
    }
}
