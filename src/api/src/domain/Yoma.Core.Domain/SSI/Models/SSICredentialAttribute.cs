namespace Yoma.Core.Domain.SSI.Models
{
  public class SSICredentialAttribute
  {
    public string Name { get; set; } = null!;

    public string NameDisplay { get; set; } = null!;

    public string ValueDisplay { get; set; } = null!;

    /// <summary>
    /// Authoritative API-native display values for complex attributes such as Skills and multi-select custom fields.
    /// ValueDisplay is a flattened display-only convenience and must not be parsed because individual values may contain commas.
    /// Scalar attributes leave this null.
    /// </summary>
    public List<SSICredentialAttributeItem>? ItemsDisplay { get; set; }
  }
}
