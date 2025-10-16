namespace Yoma.Core.Infrastructure.Bitly.Models
{
  public class BitlyOptions
  {
    public const string Section = "Bitly";

    public string BaseUrl { get; set; } = null!;

    public string GroupId { get; set; } = null!;

    public string ApiKey { get; set; } = null!;

    public string CustomDomain { get; set; } = null!;
  }
}
