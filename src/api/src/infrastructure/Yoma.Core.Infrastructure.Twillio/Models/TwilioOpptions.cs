namespace Yoma.Core.Infrastructure.Twilio.Models
{
  public class TwilioOpptions
  {
    public const string Section = "Twilio";

    public string AccountSid { get; set; }

    public string AuthToken { get; set; }

    public Dictionary<string, string>? From { get; set; }

    public Dictionary<string, string>? Templates { get; set; }
  }
}
