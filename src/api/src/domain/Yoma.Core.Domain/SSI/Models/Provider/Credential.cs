namespace Yoma.Core.Domain.SSI.Models.Provider
{
  public class Credential
  {
    public string Id { get; set; }

    public string SchemaId { get; set; }

    public IDictionary<string, string> Attributes { get; set; }
  }
}
