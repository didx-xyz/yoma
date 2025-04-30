using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Test.Notification
{
  public class WhatsAppNotificationTests : IClassFixture<CustomWebApplicationFactory>
  {
    #region Class Variables
    private readonly IServiceScope _scope;
    private readonly INotificationDeliveryService _notificationDeliveryService;
    private readonly INotificationURLFactory _notificationURLFactory;
    private readonly ICountryService _countryService;
    #endregion

    #region Constructor
    public WhatsAppNotificationTests(CustomWebApplicationFactory factory)
    {
      _scope = factory.Services.CreateScope();
      var provider = _scope.ServiceProvider;

      _notificationDeliveryService = provider.GetRequiredService<INotificationDeliveryService>();
      _notificationURLFactory = provider.GetRequiredService<INotificationURLFactory>();
      _countryService = provider.GetRequiredService<ICountryService>();
    }
    #endregion

    #region Public Members
    [Trait("Category", "WhatsApp")]
    [Fact]
    public async Task Send_OpportunityPublished_Should_Send_WhatsApp()
    {
      var opportunity = CreateTestOpportunity();
      await SendOpportunityPublishedNotification_WhatsAppOnly(opportunity);
    }

    [Trait("Category", "WhatsApp")]
    [Fact]
    public async Task Send_OpportunityVerificationCompleted_Should_Send_WhatsApp()
    {
      var opportunity = CreateTestMyOpportunity("Verification Completed");
      await SendNotification_WhatsAppOnly(opportunity, NotificationType.Opportunity_Verification_Completed);
    }

    [Trait("Category", "WhatsApp")]
    [Fact]
    public async Task Send_OpportunityVerificationRejected_Should_Send_WhatsApp()
    {
      var opportunity = CreateTestMyOpportunity("Verification Rejected");
      opportunity.CommentVerification = "ID document was blurry";
      await SendNotification_WhatsAppOnly(opportunity, NotificationType.Opportunity_Verification_Rejected);
    }

    [Trait("Category", "WhatsApp")]
    [Fact]
    public async Task Send_OpportunityVerificationPending_Should_Send_WhatsApp()
    {
      var opportunity = CreateTestMyOpportunity("Verification Pending");
      await SendNotification_WhatsAppOnly(opportunity, NotificationType.Opportunity_Verification_Pending);
    }

    [Fact]
    public void Dispose()
    {
      _scope.Dispose(); 
    }
    #endregion

    #region Private Members
    private Domain.MyOpportunity.Models.MyOpportunity CreateTestMyOpportunity(string title)
    {
      return new Domain.MyOpportunity.Models.MyOpportunity
      {
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

    private List<NotificationRecipient> CreateTestRecipients() => [new()
    {
      Username = "testuser",
      PhoneNumber = "+27831234567",
      PhoneNumberConfirmed = true,
      DisplayName = "Test User"
    }];


    private Opportunity CreateTestOpportunity(string title = "Test Opportunity")
    {
      return new Opportunity
      {
        Id = Guid.NewGuid(),
        Title = title,
        Description = "This is a test opportunity for WhatsApp notification testing.",
        TypeId = Guid.NewGuid(),
        Type = "Volunteering",
        OrganizationId = Guid.NewGuid(),
        OrganizationName = "Test Org",
        OrganizationLogoURL = null,
        OrganizationStatusId = Guid.NewGuid(),
        OrganizationStatus = OrganizationStatus.Active,
        ZltoReward = 100,
        YomaReward = 50,
        VerificationEnabled = true,
        DifficultyId = Guid.NewGuid(),
        Difficulty = "Easy",
        CommitmentIntervalId = Guid.NewGuid(),
        CommitmentInterval =TimeIntervalOption.Week,
        CommitmentIntervalCount = 2,
        CommitmentIntervalDescription = "2 weeks",
        StatusId = Guid.NewGuid(),
        Status = Status.Active,
        DateStart = DateTimeOffset.UtcNow.AddDays(1),
        DateEnd = DateTimeOffset.UtcNow.AddDays(10),
        CredentialIssuanceEnabled = false,
        Featured = true,
        EngagementTypeId = Guid.NewGuid(),
        EngagementType = EngagementTypeOption.Online,
        ShareWithPartners = false,
        Hidden = false,
        DateCreated = DateTimeOffset.UtcNow.AddDays(-1),
        CreatedByUserId = Guid.NewGuid(),
        DateModified = DateTimeOffset.UtcNow,
        ModifiedByUserId = Guid.NewGuid(),
        Published = true,
        Countries = null,
        Categories = null,
        Keywords = ["test", "whatsapp", "notification"]
      };
    }


    private async Task SendNotification_WhatsAppOnly(Domain.MyOpportunity.Models.MyOpportunity myOpportunity, NotificationType type)
    {
      var data = new NotificationOpportunityVerification
      {
        YoIDURL = _notificationURLFactory.OpportunityVerificationYoIDURL(type),
        VerificationURL = _notificationURLFactory.OpportunityVerificationURL(type, myOpportunity.OrganizationId),
        Opportunities = [
              new NotificationOpportunityVerificationItem
            {
                Title = myOpportunity.OpportunityTitle,
                DateStart = myOpportunity.DateStart,
                DateEnd = myOpportunity.DateEnd,
                Comment = myOpportunity.CommentVerification,
                URL = _notificationURLFactory.OpportunityVerificationItemURL(type, myOpportunity.OpportunityId, myOpportunity.OrganizationId),
                ZltoReward = myOpportunity.ZltoReward,
                YomaReward = myOpportunity.YomaReward
              }
          ]
      };

      await _notificationDeliveryService.Send(type, CreateTestRecipients(), data);
    }

    private async Task SendOpportunityPublishedNotification_WhatsAppOnly(Opportunity opportunity)
    {
      var countryWorldwideId = _countryService.GetByCodeAplha2(Domain.Core.Country.Worldwide.ToDescription()).Id;

      var data = new NotificationOpportunityPublished
      {
        URLOpportunitiesPublic = _notificationURLFactory.OpportunitiesPublicURL(NotificationType.Opportunity_Published, [countryWorldwideId]),
        Opportunities = [
              new NotificationOpportunityPublishedItem
            {
                Id = opportunity.Id,
                Title = opportunity.Title,
                DateStart = opportunity.DateStart,
                DateEnd = opportunity.DateEnd,
                URL = _notificationURLFactory.OpportunityPublishedItemURL(NotificationType.Opportunity_Published, opportunity.Id, opportunity.OrganizationId),
                ZltoReward = opportunity.ZltoReward,
                YomaReward = opportunity.YomaReward
            }
          ]
      };

      await _notificationDeliveryService.Send(NotificationType.Opportunity_Published, CreateTestRecipients(), data);
    }
    #endregion
  }
}
