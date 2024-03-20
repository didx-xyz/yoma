using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Domain.SSI.Helpers
{
  public static class SSISSchemaHelper
  {
    public static string ToFullName(SchemaType type, string name)
    {
      var systemCharacters = SSISchemaService.SchemaName_SystemCharacters.Union([SSISchemaService.SchemaName_TypeDelimiter]);

      if (systemCharacters.Any(name.Contains))
        throw new ArgumentException($"Contains system characters '{string.Join(' ', systemCharacters)}'", nameof(name)); //i.e. Opportunity|Learning

      return $"{type}{SSISchemaService.SchemaName_TypeDelimiter}{name}";
    }
  }
}
