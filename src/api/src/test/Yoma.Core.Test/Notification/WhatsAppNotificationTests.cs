using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;

namespace Yoma.Core.Test.Notification
{
  public class WhatsAppNotificationTests : IClassFixture<CustomWebApplicationFactory>
  {
    #region Class Variables
    private readonly INotificationDeliveryService _service;
    #endregion

    #region Constructor
    public WhatsAppNotificationTests(CustomWebApplicationFactory factory)
    {
      using var scope = factory.Services.CreateScope();
      _service = scope.ServiceProvider.GetRequiredService<INotificationDeliveryService>();
    }
    #endregion

    #region Public Members
    [Fact]
    public async Task Send_OpportunityVerificationCompleted_Should_Send_WhatsApp()
    {
      var opportunity = CreateTestOpportunity("Verification Completed");
      await SendNotification_WhatsAppOnly(opportunity, NotificationType.Opportunity_Verification_Completed);
    }

    [Fact]
    public async Task Send_OpportunityVerificationRejected_Should_Send_WhatsApp()
    {
      var opportunity = CreateTestOpportunity("Verification Rejected");
      opportunity.CommentVerification = "ID document was blurry";
      await SendNotification_WhatsAppOnly(opportunity, NotificationType.Opportunity_Verification_Rejected);
    }

    [Fact]
    public async Task Send_OpportunityVerificationPending_Should_Send_WhatsApp()
    {
      var opportunity = CreateTestOpportunity("Verification Pending");
      await SendNotification_WhatsAppOnly(opportunity, NotificationType.Opportunity_Verification_Pending);
    }
    #endregion

    #region Private Members
    private Domain.MyOpportunity.Models.MyOpportunity CreateTestOpportunity(string title)
    {
      return new Domain.MyOpportunity.Models.MyOpportunity
      {
        Username = "testuser",
        UserPhoneNumber = "+27831234567",
        UserPhoneNumberConfirmed = true,
        UserEmail = "testuser@example.com",
        UserEmailConfirmed = true,
        UserDisplayName = "Test User",
        OpportunityTitle = title,
        DateStart = DateTime.UtcNow.AddDays(-7),
        DateEnd = DateTime.UtcNow.AddDays(7),
        CommentVerification = null,
        ZltoReward = 100,
        YomaReward = 50,
        OpportunityId = Guid.NewGuid(),
        OrganizationId = Guid.NewGuid()
      };
    }

    private async Task SendNotification_WhatsAppOnly(Domain.MyOpportunity.Models.MyOpportunity myOpportunity, NotificationType type)
    {
      var recipients = new List<NotificationRecipient>
    {
        new()
        {
            Username = myOpportunity.Username,
            PhoneNumber = myOpportunity.UserPhoneNumber,
            PhoneNumberConfirmed = myOpportunity.UserPhoneNumberConfirmed,
            DisplayName = myOpportunity.UserDisplayName
        }
    };

      var data = new NotificationOpportunityVerification
      {
        YoIDURL = $"https://dummy.yoma.world/yoid/{type}",
        VerificationURL = $"https://dummy.yoma.world/verify/{myOpportunity.OrganizationId}",
        Opportunities = [
              new NotificationOpportunityVerificationItem
            {
                Title = myOpportunity.OpportunityTitle,
                DateStart = myOpportunity.DateStart,
                DateEnd = myOpportunity.DateEnd,
                Comment = myOpportunity.CommentVerification,
                URL = $"https://dummy.yoma.world/verify/item/{myOpportunity.OpportunityId}/{myOpportunity.OrganizationId}",
                ZltoReward = myOpportunity.ZltoReward,
                YomaReward = myOpportunity.YomaReward
              }
          ]
      };

      await _service.Send(type, recipients, data);
    }

    #endregion
  }
}
