using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;

namespace Yoma.Core.Domain.Notification.Services
{
  public class NotificationDeliveryService : INotificationDeliveryService
  {
    #region Class Variables
    private readonly IEmailProviderClient _emailProviderClient;
    private readonly INotificationPreferenceFilterService _notificationPreferenceFilterService;
    #endregion

    #region Constructor
    public NotificationDeliveryService(IEmailProviderClientFactory emailProviderClientFactory,
      INotificationPreferenceFilterService notificationPreferenceFilterService)
    {
      _emailProviderClient = emailProviderClientFactory.CreateClient();
      _notificationPreferenceFilterService = notificationPreferenceFilterService;
    }
    #endregion

    #region Public Members
    public async Task Send<T>(NotificationType type, List<NotificationRecipient>? recipients, T data) where T : NotificationBase
    {
      if (recipients == null || recipients.Count == 0) return;

      // future extensibility: Currently, only email is supported, determined based on user preferences/settings
      var deliveryType = DeliveryType.Email;

      if (deliveryType.HasFlag(DeliveryType.Email))
      {
        recipients = _notificationPreferenceFilterService.FilterRecipients(type, recipients)?
         .Where(r => !string.IsNullOrEmpty(r.Email))
         .ToList();

        if (recipients == null || recipients.Count == 0) return;
        await _emailProviderClient.Send(type, recipients, data);
      }
    }

    public async Task Send<T>(NotificationType type, List<(List<NotificationRecipient> Recipients, T Data)>? recipientDataGroups) where T : NotificationBase
    {
      if (recipientDataGroups == null || recipientDataGroups.Count == 0) return;

      // future extensibility: Currently, only email is supported, determined based on user preferences/settings
      var deliveryType = DeliveryType.Email;

      if (deliveryType.HasFlag(DeliveryType.Email))
      {
        recipientDataGroups = recipientDataGroups?
            .Select(group =>
            (
                Recipients: _notificationPreferenceFilterService.FilterRecipients(type, group.Recipients)?
                    .Where(r => !string.IsNullOrEmpty(r.Email))
                    .ToList() ?? [],
                group.Data
            ))
            .Where(group => group.Recipients.Count > 0)
            .ToList();

        if (recipientDataGroups == null || recipientDataGroups.Count == 0) return;
        await _emailProviderClient.Send(type, recipientDataGroups);
      }
    }
    #endregion
  }
}
