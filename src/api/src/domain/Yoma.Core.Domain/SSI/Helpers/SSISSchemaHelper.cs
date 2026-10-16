using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Domain.SSI.Helpers
{
  public static class SSISSchemaHelper
  {
    #region Class Variables
    public static readonly HashSet<char> SystemCharacters = [.. SSISchemaService.SchemaName_SystemCharacters, SSISchemaService.SchemaName_TypeDelimiter];
    public const string Name_Default = "Default";

    private static readonly HashSet<string> OpportunityDefaultNames = Enum.GetValues<Opportunity.Type>()
      .Select(ToDefaultFullName)
      .ToHashSet(StringComparer.OrdinalIgnoreCase);
    #endregion Class Variables

    #region Public Members
    /// <summary>
    /// Returns the canonical seeded default for an Opportunity type. Learning and Other deliberately
    /// share the generic schema; distinct claim sets use scoped defaults. A missing provider schema
    /// is a readiness error, not permission to silently select a different claim set.
    /// </summary>
    public static string ToDefaultFullName(Opportunity.Type type)
    {
      var context = type switch
      {
        Opportunity.Type.Other or Opportunity.Type.Learning => null,
        Opportunity.Type.Event or Opportunity.Type.Job or Opportunity.Type.ImpactAction
          or Opportunity.Type.Entrepreneurship => type.ToString(),
        _ => throw new NotSupportedException($"Opportunity type '{type}' is not supported")
      };

      return ToFullName(SchemaType.Opportunity, Name_Default, context);
    }

    /// <summary>
    /// Resolves the schema name for imported or synced Opportunities. Managed default assignments
    /// follow the target type; explicit custom names are retained for the existing applicability
    /// validation to check. An invalid custom selection is never silently replaced with a default.
    /// </summary>
    public static string ResolveOpportunitySchemaName(Opportunity.Type type, string? existingSchemaName)
    {
      var defaultName = ToDefaultFullName(type);
      existingSchemaName = existingSchemaName?.Trim();

      return string.IsNullOrEmpty(existingSchemaName) || OpportunityDefaultNames.Contains(existingSchemaName)
        ? defaultName : existingSchemaName;
    }

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
    #endregion Public Members
  }
}
