namespace Yoma.Core.Domain.SSI.Models
{
  public class SSICredentialAttribute
  {
    public string Name { get; set; } = null!;

    public string NameDisplay { get; set; } = null!;

    public string ValueDisplay { get; set; } = null!;

    /// <summary>
    /// API-controlled presentation group. Attributes are already returned in display order; clients use this value
    /// to render headings and must not infer grouping from the signed credential payload. Null represents an
    /// ungrouped attribute returned after configured groups in display-label order.
    /// </summary>
    public string? Group { get; set; }

    /// <summary>
    /// Optional API-controlled presentation subgroup.
    /// </summary>
    public string? SubGroup { get; set; }

    /// <summary>
    /// API-controlled order within the presentation group and subgroup. Null falls back to the display label.
    /// The returned collection is already ordered.
    /// </summary>
    public int? SortOrder { get; set; }

    /// <summary>
    /// Authoritative API-native display values for complex attributes such as Skills and multi-select custom fields.
    /// ValueDisplay is a flattened display-only convenience and must not be parsed because individual values may contain commas.
    /// Scalar attributes leave this null.
    /// </summary>
    public List<SSICredentialAttributeItem>? ItemsDisplay { get; set; }
  }
}
