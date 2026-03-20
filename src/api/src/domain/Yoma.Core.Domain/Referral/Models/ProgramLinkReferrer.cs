namespace Yoma.Core.Domain.Referral.Models
{
  public sealed class ProgramLinkReferrer
  {
    public Guid Id { get; set; }

    public string URL { get; set; } = null!;

    public string ShortUrl { get; set; } = null!;

    public string? QRCodeBase64 { get; set; }
  }
}
