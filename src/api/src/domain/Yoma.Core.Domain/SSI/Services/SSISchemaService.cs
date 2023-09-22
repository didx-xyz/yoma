using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSISchemaService : ISSISchemaService
    {
        public Task<SSISchema> Create(SSISchemaRequest request)
        {
            throw new NotImplementedException();
        }

        public List<SSISchema> List(bool? latestVersions)
        {
            throw new NotImplementedException();
        }
    }
}
