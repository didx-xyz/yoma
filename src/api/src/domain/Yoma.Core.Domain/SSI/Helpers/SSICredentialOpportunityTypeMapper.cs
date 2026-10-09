namespace Yoma.Core.Domain.SSI.Helpers
{
  /// <summary>
  /// Maps immutable credential type values onto today's Opportunity type enum.
  /// Historical aliases belong here, not in CSV/request lookup resolution or schema-name parsing.
  /// Add an explicit alias and regression case whenever an issued type code is renamed.
  /// </summary>
  public static class SSICredentialOpportunityTypeMapper
  {
    #region Class Variables
    // Keys are historical signed wire values and must remain literal even when current names change.
    // Task was renamed to ImpactAction in the CF configuration migration; the lookup ID was retained.
    private static readonly Dictionary<string, Opportunity.Type> HistoricalNames =
      new(StringComparer.OrdinalIgnoreCase)
      {
        ["Task"] = Opportunity.Type.ImpactAction
      };
    #endregion Class Variables

    #region Public Members
    /// <summary>
    /// Returns a supported type from a canonical code or documented historical alias without
    /// modifying the signed value. Missing/unknown values remain null for neutral wallet rendering.
    /// Display labels, numeric ordinals and combined enum expressions are not type codes.
    /// </summary>
    public static Opportunity.Type? ParseOrNull(string? value)
    {
      if (string.IsNullOrWhiteSpace(value)) return null;
      value = value.Trim();

      if (HistoricalNames.TryGetValue(value, out var historicalType)) return historicalType;

      return Enum.TryParse<Opportunity.Type>(value, true, out var type)
        && Enum.IsDefined(type)
        && string.Equals(value, type.ToString(), StringComparison.OrdinalIgnoreCase)
          ? type : null;
    }
    #endregion Public Members
  }
}
