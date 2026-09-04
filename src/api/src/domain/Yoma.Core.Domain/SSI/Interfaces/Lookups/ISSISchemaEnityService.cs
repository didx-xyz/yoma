using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces.Lookups
{
  public interface ISSISchemaEntityService
  {
    SSISchemaEntity GetById(Guid id);

    SSISchemaEntity? GetByIdOrNull(Guid id);

    SSISchemaEntityProperty GetByAttributeName(string attributeName);

    SSISchemaEntityProperty? GetByAttributeNameOrNull(string attributeName);

    /// <summary>
    /// Indicates whether the attribute exists as a static entity property or custom field in any type context.
    /// This supports general request validation; schema create and update perform strict schema type/context validation separately.
    /// </summary>
    bool AttributeExists(string attributeName);

    /// <summary>
    /// Indicates whether the optional context is supported by the specified schema type.
    /// </summary>
    bool TypeContextValid(SchemaType type, string? typeContext);

    /// <summary>
    /// Lists schema entities and active custom fields applicable to the schema type and optional type context.
    /// With no context, only generic custom fields are returned; with a context, generic and matching contextual fields are returned.
    /// </summary>
    List<SSISchemaEntity> List(SchemaType? type, string? typeContext = null);

    /// <summary>
    /// Lists schema entities with custom fields across every type context.
    /// Used internally to match and render existing provider schemas whose attributes may originate from any supported context.
    /// </summary>
    List<SSISchemaEntity> ListAll(SchemaType? type, bool activeOnly);
  }
}
