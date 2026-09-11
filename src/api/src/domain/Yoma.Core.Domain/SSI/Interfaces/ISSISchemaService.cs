using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces
{
  public interface ISSISchemaService
  {
    Task<SSISchema> GetById(string id);

    Task<SSISchema> GetByFullName(string fullName);

    Task<SSISchema?> GetByFullNameOrNull(string fullName);

    /// <summary>
    /// Lists the latest schemas, optionally filtered by schema type. When a type context is supplied,
    /// generic schemas and schemas matching that context are returned.
    /// </summary>
    Task<List<SSISchema>> List(SchemaType? type, string? typeContext = null);

    Task<List<SSISchema>> List(Guid? typeId);

    Task<SSISchema> Create(SSISchemaRequestCreate request);

    Task<SSISchema> Update(SSISchemaRequestUpdate request);

    (SSISchemaType schemaType, string displayName, string? typeContext) SchemaFullNameValidateAndGetParts(string schemaFullName);

    (SSISchemaType schemaType, string displayName, string? typeContext) SchemaIdValidateAndGetParts(string schemaId);
  }
}
