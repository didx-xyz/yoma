namespace Yoma.Core.Domain.Lookups.Models
{
  public class Language
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string CodeAlpha2 { get; set; } = null!;
  }
}
