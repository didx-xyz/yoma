namespace Yoma.Core.Domain.Lookups.Models
{
  public class Country
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string CodeAlpha2 { get; set; } = null!;

    public string CodeAlpha3 { get; set; } = null!;

    public string CodeNumeric { get; set; } = null!;
  }
}
