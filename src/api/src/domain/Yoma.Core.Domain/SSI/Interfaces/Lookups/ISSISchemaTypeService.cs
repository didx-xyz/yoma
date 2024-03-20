using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces.Lookups
{
  public interface ISSISchemaTypeService
  {
    SSISchemaType GetByName(string name);

    SSISchemaType? GetByNameOrNull(string name);

    SSISchemaType GetById(Guid id);

    SSISchemaType? GetByIdOrNull(Guid id);

    List<SSISchemaType> List();
  }
}
