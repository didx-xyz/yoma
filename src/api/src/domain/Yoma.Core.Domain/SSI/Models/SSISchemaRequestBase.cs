namespace Yoma.Core.Domain.SSI.Models
{
  public abstract class SSISchemaRequestBase
  {
    public string Name { get; set; } = null!;

    public List<string> Attributes { get; set; } = null!;
  }
}
