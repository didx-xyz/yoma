namespace Yoma.Core.Domain.Referral.Models.Lookups
{
  public class BlockReason
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string Description { get; set; } = null!;
  }
}
