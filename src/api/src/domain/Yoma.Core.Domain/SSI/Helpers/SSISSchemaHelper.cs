using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Domain.SSI.Helpers
{
  public static class SSISSchemaHelper
  {
    public static readonly HashSet<char> SystemCharacters = [.. SSISchemaService.SchemaName_SystemCharacters, SSISchemaService.SchemaName_TypeDelimiter];

    /// <summary>
    /// Constructs the full schema name from its schema type, optional type context and friendly name.
    /// </summary>
    /// <param name="type">Schema type.</param>
    /// <param name="name">Friendly schema name.</param>
    /// <param name="typeContext">Optional context that scopes the schema within its type.</param>
    public static string ToFullName(SchemaType type, string name, string? typeContext = null)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      if (SystemCharacters.Any(name.Contains))
        throw new ArgumentException($"Contains system characters '{string.Join(' ', SystemCharacters)}'", nameof(name)); //i.e. Opportunity|Learning

      var parts = new List<string> { type.ToString(), name };

      typeContext = typeContext?.Trim();
      if (!string.IsNullOrEmpty(typeContext))
      {
        if (SystemCharacters.Any(typeContext.Contains))
          throw new ArgumentException($"Contains system characters '{string.Join(' ', SystemCharacters)}'", nameof(typeContext));

        parts.Insert(1, typeContext);
      }

      return string.Join(SSISchemaService.SchemaName_TypeDelimiter, parts.ToArray());
    }
  }
}
