namespace Yoma.Core.Domain.SSI.Models
{
  public abstract class SSISchemaRequestBase
  {
    /// <summary>
    /// Friendly schema name when creating a schema; full schema name when updating an existing schema.
    /// </summary>
    public string Name { get; set; } = null!;

    public List<string> Attributes { get; set; } = null!;
  }
}
