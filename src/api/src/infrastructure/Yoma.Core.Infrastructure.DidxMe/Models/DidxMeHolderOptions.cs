namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  public class DidxMeHolderOptions
  {
    public string Realm { get; set; } = null!;

    public string ClientId { get; set; } = null!;

    public string ClientSecret { get; set; } = null!;

    public string AssertionAudience { get; set; } = null!;
  }
}
