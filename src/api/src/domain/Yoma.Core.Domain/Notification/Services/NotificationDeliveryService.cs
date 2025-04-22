using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;

namespace Yoma.Core.Domain.Notification.Services
{
  public class NotificationDeliveryService : INotificationDeliveryService
  {
    #region Class Variables
    private readonly ILogger<NotificationDeliveryService> _logger;
    private readonly IEmailProviderClient _emailProviderClient;
    private readonly IMessageProviderClient _messageProviderClient;
    private readonly INotificationPreferenceFilterService _notificationPreferenceFilterService;
    #endregion

    #region Constructor
    public NotificationDeliveryService(ILogger<NotificationDeliveryService> logger,
      IEmailProviderClientFactory emailProviderClientFactory,
      IMessageProviderClientFactory messageProviderClientFactory,
      INotificationPreferenceFilterService notificationPreferenceFilterService)
    {
      _logger = logger;
      _emailProviderClient = emailProviderClientFactory.CreateClient();
      _messageProviderClient = messageProviderClientFactory.CreateClient();
      _notificationPreferenceFilterService = notificationPreferenceFilterService;
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Sends a notification to a flat list of recipients. Recipients are filtered by preferences and routed to either
    /// the email or message provider based on whether an email address is available.
    ///
    /// - Email notifications go to recipients with an email address.
    /// - Message notifications (e.g., WhatsApp/SMS) go to recipients without an email.
    /// - Exceptions during provider send will bubble up and must be handled by the caller.
    /// </summary>
    public async Task Send<T>(NotificationType type, List<NotificationRecipient>? recipients, T data) where T : NotificationBase
    {
      if (recipients == null || recipients.Count == 0) return;

      // apply preference filtering
      recipients = _notificationPreferenceFilterService.FilterRecipients(type, recipients);
      if (recipients == null || recipients.Count == 0) return;

      // only send to recipients with confirmed email or phone number; others are silently ignored.
      var emailRecipients = recipients.Where(r => !string.IsNullOrWhiteSpace(r.Email) && r.EmailConfirmed == true).ToList();
      var messageRecipients = recipients.Except(emailRecipients).Where(r => !string.IsNullOrWhiteSpace(r.PhoneNumber) && r.PhoneNumberConfirmed == true).ToList();

      // email notifications
      if (Supported(type, MessageType.Email) && emailRecipients.Count > 0)
        await _emailProviderClient.Send(type, emailRecipients, data);

      // message notifications
      if (Supported(type, MessageType.SMS | MessageType.WhatsApp) && messageRecipients.Count > 0)
      {
        var tasks = data.FlattenItems().Select(item => _messageProviderClient.Send(MessageType.SMS | MessageType.WhatsApp, type, messageRecipients, item));
        await Task.WhenAll(tasks).FlattenAggregateException();
      }
    }

    /// <summary>
    /// Sends a notification to grouped recipients (e.g., shared data per group). Each group is filtered by recipient preferences
    /// and split into email or message batches based on whether recipients have an email address.
    ///
    /// - Email notifications are sent to recipient groups containing at least one recipient with an email address.
    /// - Message notifications (e.g., WhatsApp/SMS) are sent to groups where recipients do not have email addresses.
    /// - Exceptions during provider send will bubble up and must be handled by the caller.
    /// </summary>
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
          .Select(group => (
              Recipients: group.Recipients
                  .Where(r => !string.IsNullOrWhiteSpace(r.Email) && r.EmailConfirmed == true)
                  .ToList(),
              group.Data))
          .Where(group => group.Recipients.Count > 0)
          .ToList();

      var messageRecipientGroups = recipientDataGroups
          .Select(group => (
              Recipients: group.Recipients
                  .Except(emailRecipientGroups.SelectMany(g => g.Recipients))
                  .Where(r => !string.IsNullOrWhiteSpace(r.PhoneNumber) && r.PhoneNumberConfirmed == true)
                  .ToList(),
              group.Data))
          .Where(group => group.Recipients.Count > 0)
          .ToList();

      // email notifications
      if (Supported(type, MessageType.Email) && emailRecipientGroups.Count > 0)
        await _emailProviderClient.Send(type, emailRecipientGroups);

      // message notifications
      if (Supported(type, MessageType.SMS | MessageType.WhatsApp) && messageRecipientGroups.Count > 0)
      {
        var messageTasks = messageRecipientGroups.SelectMany(group => group.Data.FlattenItems()
        .Select(item => _messageProviderClient.Send(MessageType.SMS | MessageType.WhatsApp, type, group.Recipients, item)));

        await Task.WhenAll(messageTasks).FlattenAggregateException();
      }
    }
    #endregion

    #region Private Members
    private bool Supported(NotificationType type, MessageType messageTypes)
    {
      var supported = type switch
      {
        NotificationType.Organization_Approval_Requested => MessageType.Email, //sent to admin
        NotificationType.Organization_Approval_Approved => MessageType.Email, //sent to organization admin
        NotificationType.Organization_Approval_Declined => MessageType.Email, //sent to organization admin
        NotificationType.Opportunity_Verification_Rejected => MessageType.Email | MessageType.SMS | MessageType.WhatsApp, //sent to youth
        NotificationType.Opportunity_Verification_Completed => MessageType.Email | MessageType.SMS | MessageType.WhatsApp, //sent to youth
        NotificationType.Opportunity_Expiration_Expired => MessageType.Email, //sent to organization admin
        NotificationType.Opportunity_Expiration_WithinNextDays => MessageType.Email, //sent to organization admin
        NotificationType.Opportunity_Posted_Admin => MessageType.Email, //sent to admin
        NotificationType.Opportunity_Verification_Pending => MessageType.Email, //sent to youth; SMS and WhatsApp not supported due to cost constraints
        NotificationType.Opportunity_Verification_Pending_Admin => MessageType.Email, //sent to organization admin
        NotificationType.ActionLink_Verify_Distribution => MessageType.Email | MessageType.SMS | MessageType.WhatsApp, //sent to youth mailing / distribution list
        NotificationType.ActionLink_Verify_Approval_Requested => MessageType.Email, //sent to admin
        NotificationType.ActionLink_Verify_Approval_Approved => MessageType.Email, //sent to organization admin
        NotificationType.ActionLink_Verify_Approval_Declined => MessageType.Email, //sent to organization admin
        NotificationType.Opportunity_Published => MessageType.Email | MessageType.SMS | MessageType.WhatsApp, //sent to youth
        NotificationType.Download => MessageType.Email, //sent to admin or organization admin

        _ => throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported"),
      };

      if ((messageTypes & supported) != 0) return true;
      _logger.LogInformation("Notification skipped: Notification type '{type}' is not supported for the provided message type(s)", type);
      return false;
    }
    #endregion
  }
}
