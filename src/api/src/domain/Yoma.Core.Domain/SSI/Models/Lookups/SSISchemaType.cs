namespace Yoma.Core.Domain.SSI.Models.Lookups
{
  public class SSISchemaType
  {
    public Guid Id { get; set; }

    public SchemaType Type { get; set; }

    public string Name { get; set; } = null!;

    public string Description { get; set; } = null!;

    public bool SupportMultiple { get; set; }
  }
}
