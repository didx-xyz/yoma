namespace Yoma.Core.Infrastructure.Zlto.Models
{
  public class AuthResponse
  {
    public string AccessToken { get; set; } = null!;

    public string PartnerName { get; set; } = null!;

    public string PartnerId { get; set; } = null!;

    public DateTimeOffset Date { get; } = DateTimeOffset.UtcNow;

    public DateTimeOffset DateExpire { get; set; }
  }
}
