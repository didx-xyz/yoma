using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSISchemaService
    {
        Task<SSISchema> GetByName(string name);

        Task<SSISchema?> GetByNameOrNull(string name);

        Task<List<SSISchema>> List();

        Task<SSISchema> Create(SSISchemaRequest request);
    }
}
