using Yoma.Core.Domain.Notification.Models;

namespace Yoma.Core.Domain.Notification.Interfaces
{
  public interface INotificationDeliveryService
  {
    Task Send<T>(NotificationType type, List<NotificationRecipient>? recipients, T data)
      where T : NotificationBase;

    Task Send<T>(NotificationType type, List<(List<NotificationRecipient> Recipients, T Data)>? recipientDataGroups)
      where T : NotificationBase;
  }
}
