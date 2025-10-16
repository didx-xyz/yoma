namespace Yoma.Core.Domain.SSI.Models.Provider
{
  public class Schema
  {
    public string Id { get; set; } = null!;

    public string Name { get; set; } = null!;

    public Version Version { get; set; } = null!;

    public ArtifactType ArtifactType { get; set; }

    public ICollection<string> AttributeNames { get; set; } = null!;
  }
}
