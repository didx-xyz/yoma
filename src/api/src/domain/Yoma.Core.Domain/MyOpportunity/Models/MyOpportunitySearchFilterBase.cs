using Newtonsoft.Json;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public abstract class MyOpportunitySearchFilterBase : PaginationFilter, IHashableObject
  {
    public Action Action { get; set; }

    public List<VerificationStatus>? VerificationStatuses { get; set; }

    /// <summary>
    /// Filters MyOpportunity records using configured custom field values.
    /// </summary>
    public List<CustomFieldFilter>? CustomFields { get; set; }

    [JsonIgnore]
    internal bool TotalCountOnly { get; set; }

    /// <summary>
    /// Indicates whether the query should be processed with fewer restrictions, bypassing pagination validation, ordering, 
    /// and expensive data processing (such as URL resolution).
    /// When set to <c>true</c>, pagination validation is skipped, ordering is not applied unless explicitly required, 
    /// and additional costly computations are avoided.
    /// However, if <c>PaginationEnabled</c> is <c>true</c>, pagination will still be applied, but unnecessary processing 
    /// will be minimized.
    /// </summary>
    [JsonIgnore]
    internal bool UnrestrictedQuery { get; set; } = false;

    /// <summary>
    /// Flag indicating whether to include only published records (relating to active opportunities, 
    /// irrespective of their start status, that relate to active organizations) for non-verification actions 
    /// ('Saved,' 'Viewed,' and 'NavigatedExternalLink').
    /// When set to true (default), only published records are included.
    /// When set to false, all records are included, irrespective of their published status.
    /// </summary>
    [JsonIgnore]
    internal bool NonActionVerificationPublishedOnly { get; set; } = true;

    [JsonIgnore]
    internal abstract FilterSortOrder SortOrder { get; set; }

    public virtual void NormalizeForHashing()
    {
      SanitizeCollections();

      VerificationStatuses = VerificationStatuses?.OrderBy(o => o).ToList();

      if (CustomFields == null) return;

      foreach (var customField in CustomFields)
      {
        customField.Values = customField.Values?
          .OrderBy(o => o, StringComparer.OrdinalIgnoreCase)
          .ToList();
      }

      CustomFields = [.. CustomFields
        .OrderBy(o => o.Key, StringComparer.OrdinalIgnoreCase)
        .ThenBy(o => o.Operator)
        .ThenBy(o => o.Value, StringComparer.Ordinal)
        .ThenBy(o => string.Join(CustomFieldValue.Value_Delimiter, o.Values ?? []), StringComparer.Ordinal)];
    }

    public virtual void SanitizeCollections()
    {
      VerificationStatuses = VerificationStatuses?.Distinct().ToList();
      if (VerificationStatuses?.Count == 0) VerificationStatuses = null;

      // Preserve duplicate keys so validation can reject the ambiguous filters instead of silently discarding values.
      if (CustomFields?.Count == 0) CustomFields = null;
    }
  }
}
