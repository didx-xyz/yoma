using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSISchemaService
    {
        List<SSISchema> List();

        Task<SSISchema> Upsert(SSISchemaRequest request);
    }
}
