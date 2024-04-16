namespace Yoma.Core.Infrastructure.Bitly.Models
{
  public class BitlyOptions
  {
    public const string Section = "Bitly";

    public string GroupId { get; set; }

    public string ApiKey { get; set; }

    public ShortLinkType ShortLinkType { get; set; }

    public string DomainCustom { get; set; }

    public string[] Tags { get; set; }
  }
}
