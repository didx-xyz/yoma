using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces.Lookups
{
    public interface ISSISchemaEntityService
    {
        SSISchemaEntity GetById(Guid id);

        SSISchemaEntity? GetByIdOrNull(Guid id);

        List<SSISchemaEntity> List();
    }
}
