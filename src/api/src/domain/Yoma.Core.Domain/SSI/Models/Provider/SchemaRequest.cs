namespace Yoma.Core.Domain.SSI.Models.Provider
{
  public class SchemaRequest
  {
    /// <summary>
    /// Full schema name submitted to the SSI provider.
    /// </summary>
    public string Name { get; set; } = null!;

    public ArtifactType ArtifactType { get; set; }

    public ICollection<string> Attributes { get; set; } = null!;
  }
}
