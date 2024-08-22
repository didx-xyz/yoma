namespace Yoma.Core.Domain.SSI.Models
{
  public abstract class SSISchemaRequestBase
  {
    public string Name { get; set; }

    public List<string> Attributes { get; set; }
  }
}
