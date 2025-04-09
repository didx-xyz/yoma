using Yoma.Core.Domain.Notification.Models;

namespace Yoma.Core.Domain.Notification.Interfaces
{
  public interface IMessageProviderClient
  {
    Task Send<T>(MessageType allowedMessageTypes, NotificationType notificationType, List<NotificationRecipient> recipients, T data)
    where T : NotificationBase;

    Task Send<T>(MessageType allowedMessageTypes, NotificationType notificationType, List<(List<NotificationRecipient> Recipients, T Data)> recipientDataGroups)
      where T : NotificationBase;
  }
}
