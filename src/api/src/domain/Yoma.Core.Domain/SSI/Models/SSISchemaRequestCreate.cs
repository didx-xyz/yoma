namespace Yoma.Core.Domain.SSI.Models
{
  /// <summary>
  /// Creates a schema using the friendly name supplied through <see cref="SSISchemaRequestBase.Name"/>.
  /// </summary>
  public class SSISchemaRequestCreate : SSISchemaRequestBase
  {
    public Guid TypeId { get; set; }

    /// <summary>
    /// Optional context that scopes the schema within its type; i.e. for opportunity schemas this is the opportunity type
    /// </summary>
    public string? TypeContext { get; set; }

    public ArtifactType ArtifactType { get; set; }
  }
}
