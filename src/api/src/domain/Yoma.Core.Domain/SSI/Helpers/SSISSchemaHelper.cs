using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Domain.SSI.Helpers
{
  public static class SSISSchemaHelper
  {
    public static readonly HashSet<char> SystemCharacters = [.. SSISchemaService.SchemaName_SystemCharacters, SSISchemaService.SchemaName_TypeDelimiter];

    public static string ToFullName(SchemaType type, string name)
    {
      if (SystemCharacters.Any(name.Contains))
        throw new ArgumentException($"Contains system characters '{string.Join(' ', SystemCharacters)}'", nameof(name)); //i.e. Opportunity|Learning

      return $"{type}{SSISchemaService.SchemaName_TypeDelimiter}{name}";
    }
  }
}
