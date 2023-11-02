using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSISchemaService
    {
        Task<SSISchema> GetByName(string fullName);

        Task<SSISchema?> GetByNameOrNull(string fullName);

        Task<List<SSISchema>> List(SchemaType? type);

        Task<List<SSISchema>> List(Guid? typeId);

        Task<SSISchema> Create(SSISchemaRequestCreate request);

        Task<SSISchema> Update(SSISchemaRequestUpdate request);
    }
}
