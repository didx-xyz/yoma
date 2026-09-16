using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.SSI.Models.Lookups
{
  /// <summary>
  /// Represents a dynamic custom field that can be selected as a credential schema attribute.
  /// The definition remains owned by the custom-field domain and is not persisted as a static SSI schema entity property.
  /// </summary>
  public sealed class SSISchemaEntityCustomField
  {
    public Guid Id { get; set; }

    public string Key { get; set; } = null!;

    public string NameDisplay { get; set; } = null!;

    public string? Description { get; set; }

    public string AttributeName { get; set; } = null!;

    public string TypeName { get; set; } = null!;

    public string? TypeContext { get; set; }

    public CustomFieldDataType DataType { get; set; }

    public CustomFieldLookupType? LookupType { get; set; }

    public bool? SupportsMultiple { get; set; }

    public string Group { get; set; } = null!;

    public string? SubGroup { get; set; }

    public int SortOrder { get; set; }

    public bool Required { get; set; }

    public bool IsActive { get; set; }

    /// <summary>
    /// Indicates that the field is required by a developer-controlled business process.
    /// Schema management displays this value but does not manage it.
    /// </summary>
    public bool IsSystem { get; set; }

    /// <summary>
    /// Indicates that the field has been mapped to at least one credential schema version.
    /// This persisted value is managed by schema management and initial schema seeding.
    /// </summary>
    public bool IsSchemaMapped { get; set; }

    /// <summary>
    /// Indicates that editing restrictions apply because the field is either developer-controlled or schema mapped.
    /// </summary>
    public bool IsProtected => IsSystem || IsSchemaMapped;
  }
}
