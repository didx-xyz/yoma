namespace Yoma.Core.Infrastructure.SendGrid.Models
{
  public class SendGridOptions
  {
    public const string Section = "SendGrid";

    public string ApiKey { get; set; } = null!;

    public SendGridEmailAddress From { get; set; } = null!;

    public SendGridEmailAddress? ReplyTo { get; set; }

    public Dictionary<string, string> Templates { get; set; } = null!;
  }

  public class SendGridEmailAddress
  {
    public string Name { get; set; } = null!;

    public string Email { get; set; } = null!;
  }
}
