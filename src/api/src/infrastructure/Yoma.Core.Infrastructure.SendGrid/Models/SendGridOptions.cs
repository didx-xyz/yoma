namespace Yoma.Core.Infrastructure.SendGrid.Models
{
  public class SendGridOptions
  {
    public const string Section = "SendGrid";

    public string ApiKey { get; set; }

    public SendGridEmailAddress From { get; set; }

    public SendGridEmailAddress? ReplyTo { get; set; }

    public Dictionary<string, string> Templates { get; set; }
  }

  public class SendGridEmailAddress
  {
    public string Name { get; set; }

    public string Email { get; set; }
  }
}
