namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationRecipient
  {
    public string Username { get; set; }

    public string? PhoneNumber { get; set; }

    public string? Email { get; set; }

    public string? DisplayName { get; set; }
  }
}
