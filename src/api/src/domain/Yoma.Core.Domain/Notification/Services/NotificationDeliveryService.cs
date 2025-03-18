using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;

namespace Yoma.Core.Domain.Notification.Services
{
  public class NotificationDeliveryService : INotificationDeliveryService
  {
    #region Class Variables
    private readonly IEmailProviderClient _emailProviderClient;
    private readonly IMessageProviderClient _messageProviderClient;
    private readonly INotificationPreferenceFilterService _notificationPreferenceFilterService;
    #endregion

    #region Constructor
    public NotificationDeliveryService(IEmailProviderClientFactory emailProviderClientFactory,
      IMessageProviderClientFactory messageProviderClientFactory,
      INotificationPreferenceFilterService notificationPreferenceFilterService)
    {
      _emailProviderClient = emailProviderClientFactory.CreateClient();
      _messageProviderClient = messageProviderClientFactory.CreateClient();
      _notificationPreferenceFilterService = notificationPreferenceFilterService;
    }
    #endregion

    #region Public Members
    public async Task Send<T>(NotificationType type, List<NotificationRecipient>? recipients, T data) where T : NotificationBase
    {
      if (recipients == null || recipients.Count == 0) return;

      // apply preference filtering
      recipients = _notificationPreferenceFilterService.FilterRecipients(type, recipients);
      if (recipients == null || recipients.Count == 0) return;

      var emailRecipients = recipients.Where(r => !string.IsNullOrEmpty(r.Email)).ToList();
      var messageRecipients = recipients.Except(emailRecipients).ToList();

      // email notifications
      if (emailRecipients.Count > 0)
        await _emailProviderClient.Send(type, emailRecipients, data);

      // message notifications
      if (messageRecipients.Count > 0)
        await _messageProviderClient.Send(MessageType.WhatsApp, type, messageRecipients, data);
    }

    public async Task Send<T>(NotificationType type, List<(List<NotificationRecipient> Recipients, T Data)>? recipientDataGroups) where T : NotificationBase
    {
      if (recipientDataGroups == null || recipientDataGroups.Count == 0) return;

      // apply preference filtering
      recipientDataGroups = [.. recipientDataGroups
          .Select(group =>
          (
              Recipients: _notificationPreferenceFilterService.FilterRecipients(type, group.Recipients ?? []) ?? [],
              group.Data
          ))
          .Where(group => group.Recipients.Count > 0)];
      if (recipientDataGroups.Count == 0) return;

      var emailRecipientGroups = recipientDataGroups
          .SelectMany(group => new[]
          {
          (
              Recipients: group.Recipients.Where(r => !string.IsNullOrEmpty(r.Email)).ToList(),
              group.Data
          )
            })
          .Where(group => group.Recipients.Count > 0)
          .ToList();

      var messageRecipientGroups = recipientDataGroups
          .SelectMany(group => new[]
          {
          (
              Recipients: group.Recipients.Where(r => string.IsNullOrEmpty(r.Email)).ToList(),
              group.Data
          )
          })
          .Where(group => group.Recipients.Count > 0)
          .ToList();

      // email notifications
      if (emailRecipientGroups.Count > 0)
        await _emailProviderClient.Send(type, emailRecipientGroups);

      // message notifications
      if (messageRecipientGroups.Count > 0)
        await _messageProviderClient.Send(MessageType.SMS, type, messageRecipientGroups);
    }
  }
  #endregion
}
