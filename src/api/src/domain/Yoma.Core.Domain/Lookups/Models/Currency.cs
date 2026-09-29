namespace Yoma.Core.Domain.Lookups.Models
{
  public class Currency
  {
    public Guid Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;
  }
}
