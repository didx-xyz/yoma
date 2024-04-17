namespace Yoma.Core.Infrastructure.Bitly.Models
{
  public class BitlyOptions
  {
    public const string Section = "Bitly";

    public string BaseUrl { get; set; }

    public string GroupId { get; set; }

    public string ApiKey { get; set; }

    public string GenericDomain { get; set; }

    public string CustomDomain { get; set; }
  }
}
