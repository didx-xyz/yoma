namespace Yoma.Core.Domain.Lookups.Models
{
  public class Country
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string CodeAlpha2 { get; set; }

    public string CodeAlpha3 { get; set; }

    public string CodeNumeric { get; set; }
  }
}
