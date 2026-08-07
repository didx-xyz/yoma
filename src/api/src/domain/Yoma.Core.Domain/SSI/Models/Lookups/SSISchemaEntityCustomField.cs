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

    public bool IsSystem { get; set; }

    public bool IsSchemaMapped { get; set; }
  }
}
