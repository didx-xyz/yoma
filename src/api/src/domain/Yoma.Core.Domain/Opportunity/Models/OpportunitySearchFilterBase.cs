using Microsoft.AspNetCore.Mvc.ModelBinding;
using Newtonsoft.Json;
using System.Diagnostics.CodeAnalysis;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public abstract class OpportunitySearchFilterBase : OpportunitySearchSelection, IPaginationFilter, IHashableObject
  {
    public bool? Featured { get; set; }

    public bool? ShareWithPartners { get; set; }

    /// <summary>
    /// Cross-field text search over opportunities, organisations, types,
    /// categories and skills. This control is root-only.
    /// </summary>
    public string? ValueContains { get; set; }

    public List<OpportunitySearchGroup>? Groups { get; set; }

    /// <summary>
    /// Validated public sort instructions. Omission retains the endpoint's
    /// established default. ID ascending is always the final tie-break.
    /// </summary>
    public List<OpportunitySearchOrdering>? Ordering { get; set; }

    public int? PageNumber { get; set; }

    public int? PageSize { get; set; }

    [JsonIgnore]
    [BindNever]
    [MemberNotNull(nameof(PageNumber), nameof(PageSize))]
#pragma warning disable CS8774
    public bool PaginationEnabled => PageSize.HasValue || PageNumber.HasValue;
#pragma warning restore CS8774

    /// <summary>
    /// Count the same filtered query without paging or loading result items.
    /// This is a search control, not a CSV-export option.
    /// </summary>
    public bool TotalCountOnly { get; set; }

    [JsonIgnore]
    internal List<PublishedState>? PublishedStates { get; set; }

    [JsonIgnore]
    internal List<Guid>? Opportunities { get; set; }

    [JsonIgnore]
    internal bool ExcludeHidden { get; set; }

    [JsonIgnore]
    internal List<FilterOrdering<Opportunity>>? OrderInstructions { get; set; } =
    [
      new() { OrderBy = e => e.DateCreated, SortOrder = FilterSortOrder.Descending },
      new() { OrderBy = e => e.Id, SortOrder = FilterSortOrder.Ascending }
    ];

    public override void NormalizeForHashing()
    {
      base.NormalizeForHashing();
      if (Groups != null)
        foreach (var group in Groups)
          if (group?.AnyOf != null)
          {
            foreach (var branch in group.AnyOf) branch?.NormalizeForHashing();
            group.AnyOf = [.. group.AnyOf.OrderBy(o => JsonConvert.SerializeObject(o), StringComparer.Ordinal)];
          }

      Groups = Groups?.OrderBy(o => JsonConvert.SerializeObject(o), StringComparer.Ordinal).ToList();
    }

    public override void SanitizeCollections()
    {
      base.SanitizeCollections();
      if (Groups != null)
        foreach (var group in Groups)
          if (group?.AnyOf != null)
            foreach (var branch in group.AnyOf) branch?.SanitizeCollections();
    }
  }
}
