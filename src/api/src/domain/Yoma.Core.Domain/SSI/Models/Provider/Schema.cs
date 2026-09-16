namespace Yoma.Core.Domain.SSI.Models.Provider
{
  public class Schema
  {
    public string Id { get; set; } = null!;

    /// <summary>
    /// Full schema name used by the SSI provider.
    /// </summary>
    public string Name { get; set; } = null!;

    public Version Version { get; set; } = null!;

    public ArtifactType ArtifactType { get; set; }

    public ICollection<string> AttributeNames { get; set; } = null!;
  }
}
