using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces.Lookups
{
  public interface ISSISchemaEntityService
  {
    SSISchemaEntity GetById(Guid id);

    SSISchemaEntity? GetByIdOrNull(Guid id);

    SSISchemaEntityProperty GetByAttributeName(string attributeName);

    SSISchemaEntityProperty? GetByAttributeNameOrNull(string attributeName);

    bool AttributeExists(string attributeName);

    bool TypeContextValid(SchemaType type, string? typeContext);

    List<SSISchemaEntity> List(SchemaType? type);

    List<SSISchemaEntity> List(SchemaType? type, string? typeContext);

    List<SSISchemaEntity> ListAll(SchemaType? type, bool activeOnly);
  }
}
