namespace Yoma.Core.Domain.Notification.Models
{
  public class NotificationRecipient
  {
    public string Username { get; set; }

    public string? PhoneNumber { get; set; }

    public bool? PhoneNumberConfirmed { get; set; }

    public string? Email { get; set; }

    public bool? EmailConfirmed { get; set; }

    public string? DisplayName { get; set; }

    public bool Equals(NotificationRecipient? other)
    {
      if (other is null) return false;
      return Username.Equals(other.Username, StringComparison.InvariantCultureIgnoreCase);
    }

    public override bool Equals(object? obj) => Equals(obj as NotificationRecipient);

    public override int GetHashCode() => Username.ToLowerInvariant().GetHashCode();
  }
}
