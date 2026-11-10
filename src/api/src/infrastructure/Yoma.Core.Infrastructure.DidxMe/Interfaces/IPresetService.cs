using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Interfaces
{
  public interface IPresetService
  {
    List<Schema> ListDomainSchemas(bool latestVersion);

    CredentialPresetMapping? GetMappingOrNull(string id);

    CredentialPresetMapping GetMapping(string id);

    CredentialPresetMapping? GetMappingByVctOrNull(string vct);

    Task<Schema> UpsertPreset(SchemaRequest request);
  }
}
