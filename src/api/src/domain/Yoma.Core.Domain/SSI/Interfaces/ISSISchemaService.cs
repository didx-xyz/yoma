using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Interfaces
{
  public interface ISSISchemaService
  {
    Task<SSISchema> GetById(string id);

    Task<SSISchema> GetByFullName(string fullName);

    Task<SSISchema?> GetByFullNameOrNull(string fullName);

    Task<List<SSISchema>> List(SchemaType? type);

    Task<List<SSISchema>> List(Guid? typeId);

    Task<SSISchema> Create(SSISchemaRequestCreate request);

    Task<SSISchema> Update(SSISchemaRequestUpdate request);

    (SSISchemaType schemaType, string displayName) SchemaFullNameValidateAndGetParts(string schemaFullName);
  }
}
