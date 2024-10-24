using Yoma.Core.Domain.Notification.Models;

namespace Yoma.Core.Domain.Notification.Interfaces
{
  public interface INotificationPreferenceFilterService
  {
    List<NotificationRecipient>? FilterRecipients(NotificationType type, List<NotificationRecipient>? recipients);
  }
}
