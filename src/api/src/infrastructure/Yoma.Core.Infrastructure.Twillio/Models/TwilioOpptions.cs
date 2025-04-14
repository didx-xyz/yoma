namespace Yoma.Core.Infrastructure.Twilio.Models
{
  public class TwilioOptions
  {
    public const string Section = "Twilio";

    public string AccountSid { get; set; }

    public string AuthToken { get; set; }

    public TwillioOptionsFrom From { get; set; }

    public Dictionary<string, string>? TemplatesWhatsApp { get; set; } // Key: NotificationType enum string value, Value: Twilio WhatsApp template id

    public int DeliveryPollingWhatsAppTimeoutInSeconds { get; set; }
  }

  public class TwillioOptionsFrom
  {
    public string? WhatsApp { get; set; }

    public Dictionary<string, string>? SMS { get; set; } // Key: Country alpha 2 code (e.g., "ZA"), Value: From number include country dailing code (e.g., "+27XXXXXXXXX")
  }
}
