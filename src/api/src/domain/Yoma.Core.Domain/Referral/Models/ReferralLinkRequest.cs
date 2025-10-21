namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ReferralLinkRequestBase
  {
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public bool? IncludeQRCode { get; set; }
  }

  public class ReferralLinkRequestCreate : ReferralLinkRequestBase
  {
    public Guid ProgramId { get; set; }
  }

  public class ReferralLinkRequestUpdate : ReferralLinkRequestBase
  {
    public Guid Id { get; set; }
  }
}
