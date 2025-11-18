namespace Yoma.Core.Domain.SSI.Models.Provider
{
  public class Credential
  {
    public string Id { get; set; } = null!;

    public string SchemaId { get; set; } = null!;

    public IDictionary<string, string> Attributes { get; set; } = null!;
  }
}
