namespace Yoma.Core.Domain.Core.Models
{
  public sealed class CustomFieldDefinition
  {
    public Guid Id { get; set; }

    public string EntityType { get; set; } = null!;

    /// <summary>
    /// Optional fall-through context. Null applies to all records for the entity; a value scopes the field to a specific type/context.
    /// </summary>
    public string? EntityContext { get; set; }

    public string Key { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    /// <summary>
    /// Primary UI grouping used by wizard steps and grouped filters.
    /// </summary>
    public string Group { get; set; } = null!;

    /// <summary>
    /// Optional secondary grouping within the primary group.
    /// </summary>
    public string? SubGroup { get; set; }

    public CustomFieldDataType DataType { get; set; }

    /// <summary>
    /// Stored using the same text format as submitted values for the selected data type.
    /// </summary>
    public string? DefaultValue { get; set; }

    public string? ValidationRegex { get; set; }

    public string? ValidationErrorMessage { get; set; }

    public bool IsRequired { get; set; }

    /// <summary>
    /// Applies to option fields; indicates whether more than one option can be selected.
    /// Null for non-option fields.
    /// </summary>
    public bool? SupportsMultiple { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    /// <summary>
    /// Indicates that the field is used by code, partner mapping, credential mapping, or another protected system flow.
    /// </summary>
    public bool IsSystem { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public List<CustomFieldOption>? Options { get; set; }
  }
}
