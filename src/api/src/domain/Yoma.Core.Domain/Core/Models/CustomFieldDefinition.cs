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
    /// Existing Yoma lookup used to supply and validate option values.
    /// When specified, clients must submit the selected lookup record IDs (GUIDs) through value or values.
    /// Null indicates that values come from the definition's custom options.
    /// </summary>
    public CustomFieldLookupType? LookupType { get; set; }

    public string? ValidationRegex { get; set; }

    public string? ValidationErrorMessage { get; set; }

    public bool IsRequired { get; set; }

    /// <summary>
    /// Applies to option fields; indicates whether more than one option can be selected.
    /// Null for non-option fields.
    /// </summary>
    public bool? SupportsMultiple { get; set; }

    public int SortOrder { get; set; }

    /// <summary>
    /// Controls whether the definition is available for new data capture and discovery.
    /// Deactivation is the normal retirement mechanism and preserves the definition, configured values and historical meaning.
    /// Hard deletion is intended only for an unprotected definition that has never been used or referenced; the domain must first
    /// confirm that no system, partner, schema, option or persisted-value dependencies exist.
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Indicates that the field is required by code, a partner mapping or another developer-controlled business process.
    /// This persisted flag is managed through development and seeding only; credential schema management must not set or clear it.
    /// </summary>
    public bool IsSystem { get; set; }

    /// <summary>
    /// Indicates that the field has been mapped to at least one credential schema version.
    /// This persisted flag is set by admin schema management or initial schema seeding. Removing the field from a later schema
    /// version does not clear it because previous schema versions and issued credentials retain the historical dependency.
    /// </summary>
    public bool IsSchemaMapped { get; set; }

    /// <summary>
    /// Indicates that editing restrictions apply because the field is either developer-controlled or credential-schema mapped.
    /// Protected fields cannot be hard deleted, deactivated or structurally changed. Presentation metadata such as title,
    /// description, grouping and ordering may still be updated.
    /// </summary>
    public bool IsProtected => IsSystem || IsSchemaMapped;

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public List<CustomFieldOption>? Options { get; set; }
  }
}
