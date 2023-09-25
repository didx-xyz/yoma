using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSISchemaService
    {
        Task<List<SSISchema>> List(bool? latestVersions);

        Task<SSISchema> Create(SSISchemaRequest request);
    }
}
