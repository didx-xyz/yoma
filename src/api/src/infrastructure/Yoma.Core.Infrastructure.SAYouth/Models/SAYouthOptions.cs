namespace Yoma.Core.Infrastructure.SAYouth.Models
{
  public class SAYouthOptions
  {
    public const string Section = "SAYouth";

    public string BaseUrl { get; set; } = null!;

    public string ApiVersion { get; set; } = null!;

    public string ApiKey { get; set; } = null!;
  }
}
