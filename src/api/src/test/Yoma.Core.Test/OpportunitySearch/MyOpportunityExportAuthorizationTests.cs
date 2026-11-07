using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using System.Security.Claims;
using Xunit;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Services;
using Yoma.Core.Domain.MyOpportunity.Validators;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;

namespace Yoma.Core.Test.OpportunitySearch
{
  public class MyOpportunityExportAuthorizationTests
  {
    #region Tests
    [Fact]
    public async Task ChecksSelectedOrganizationsBeforeSavingTheSameFilter()
    {
      var fixture = new Fixture();
      var filter = new MyOpportunitySearchFilterAdmin { Organizations = [fixture.Organization] };
      var authorized = false;
      fixture.Organizations.Setup(service => service.IsAdminsOf(filter.Organizations, true))
        .Callback(() => authorized = true).Returns(true);
      fixture.Download.Setup(service => service.Schedule(fixture.User.Id, DownloadScheduleType.MyOpportunityVerifications, filter))
        .Callback(() => Assert.True(authorized)).Returns(Task.CompletedTask);

      var (scheduleForProcessing, fileName, bytes) = await fixture.Service.ExportOrScheduleToCSV(filter, true);

      Assert.True(scheduleForProcessing);
      fixture.Download.Verify(service => service.Schedule(fixture.User.Id, DownloadScheduleType.MyOpportunityVerifications, filter), Times.Once);
    }

    [Fact]
    public async Task UnauthorizedSelectionIsNotScheduled()
    {
      var fixture = new Fixture();
      fixture.Organizations.Setup(service => service.IsAdminsOf(It.IsAny<List<Guid>>(), true))
        .Throws(new SecurityException("Unauthorized"));

      await Assert.ThrowsAsync<SecurityException>(() => fixture.Service.ExportOrScheduleToCSV(new()
      {
        Organizations = [Guid.NewGuid()]
      }, true));

      fixture.Download.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task MissingOrEmptySelectionStoresPermittedOrganizationsAtTheRoot(bool empty)
    {
      var fixture = new Fixture();
      var filter = new MyOpportunitySearchFilterAdmin
      {
        Organizations = empty ? [] : null
      };
      fixture.Download.Setup(service => service.Schedule(fixture.User.Id, DownloadScheduleType.MyOpportunityVerifications, filter))
        .Callback(() =>
        {
          // Exercise the same normalization and serialization as DownloadService.Schedule.
          _ = HashHelper.ComputeSHA256Hash(filter);
          var saved = JsonConvert.DeserializeObject<MyOpportunitySearchFilterAdmin>(JsonConvert.SerializeObject(filter))!;
          Assert.Equal([fixture.Organization], saved.Organizations);
        }).Returns(Task.CompletedTask);

      await fixture.Service.ExportOrScheduleToCSV(filter, true);

      fixture.Download.Verify(service => service.Schedule(fixture.User.Id, DownloadScheduleType.MyOpportunityVerifications, filter), Times.Once);
    }

    [Fact]
    public async Task NoPermittedOrganizationsCannotBecomeAnUnrestrictedExport()
    {
      var fixture = new Fixture();
      fixture.Organizations.Setup(service => service.ListAdminsOf(false)).Returns([]);

      await Assert.ThrowsAsync<SecurityException>(() => fixture.Service.ExportOrScheduleToCSV(new(), true));

      fixture.Download.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(true, true)]
    [InlineData(false, false)]
    public async Task GlobalAdminOrTrustedCallerRetainsExistingBehavior(bool administrator, bool ensureAuthorization)
    {
      var fixture = new Fixture(administrator);
      var filter = new MyOpportunitySearchFilterAdmin();

      await fixture.Service.ExportOrScheduleToCSV(filter, ensureAuthorization);

      Assert.Null(filter.Organizations);
      fixture.Organizations.Verify(service => service.ListAdminsOf(false), Times.Never);
      fixture.Organizations.Verify(service => service.IsAdminsOf(It.IsAny<List<Guid>>(), It.IsAny<bool>()), Times.Never);
      fixture.Download.Verify(service => service.Schedule(fixture.User.Id, DownloadScheduleType.MyOpportunityVerifications, filter), Times.Once);
    }
    #endregion

    #region Fixture
    private sealed class Fixture
    {
      internal User User { get; } = new() { Id = Guid.NewGuid(), Username = "export-user" };
      internal Guid Organization { get; } = Guid.NewGuid();
      internal Mock<IOrganizationService> Organizations { get; } = new();
      internal Mock<IDownloadService> Download { get; } = new();
      internal MyOpportunityService Service { get; }

      internal Fixture(bool administrator = false)
      {
        var accessor = new HttpContextAccessor
        {
          HttpContext = new DefaultHttpContext
          {
            User = new ClaimsPrincipal(new ClaimsIdentity([
              new Claim(ClaimTypes.Name, User.Username),
              new Claim(ClaimTypes.Role, administrator ? Constants.Role_Admin : Constants.Role_OrganizationAdmin)], "test"))
          }
        };
        var users = new Mock<IUserService>();
        users.Setup(service => service.GetCurrentUser(false, false, It.IsAny<bool>())).Returns(User);
        Organizations.Setup(service => service.ListAdminsOf(false)).Returns([new OrganizationInfoAdmin { Id = Organization }]);
        var opportunity = Mock.Of<IOpportunityService>();
        var countries = Mock.Of<ICountryService>();
        var intervals = Mock.Of<ITimeIntervalService>();
        Service = new MyOpportunityService(NullLogger<MyOpportunityService>.Instance, Options.Create(new AppSettings()), accessor,
          users.Object, Organizations.Object, opportunity, Mock.Of<IMyOpportunityActionService>(), Mock.Of<IMyOpportunityVerificationStatusService>(),
          Mock.Of<IOpportunityStatusService>(), Mock.Of<IOrganizationStatusService>(), Mock.Of<IBlobService>(), Mock.Of<ISSICredentialService>(),
          Mock.Of<IRewardService>(), Mock.Of<ILinkService>(), Mock.Of<INotificationURLFactory>(), Mock.Of<INotificationDeliveryService>(),
          countries, Mock.Of<IGenderService>(), intervals, Download.Object, Mock.Of<IOpportunityVerificationTypeService>(), Mock.Of<IDelayedExecutionService>(),
          Mock.Of<ISyncUserAuthenticationService>(), Mock.Of<ISyncStateService>(), Mock.Of<IProcessingService>(),
          Mock.Of<ICustomFieldDefinitionService>(), Mock.Of<ICustomFieldValueService>(),
          new MyOpportunitySearchFilterVerificationFilesAdminValidator(), new MyOpportunitySearchFilterAdminValidator(), new MyOpportunityRequestValidatorVerify(intervals, countries),
          new MyOpportunityRequestValidatorVerifyFinalize(users.Object, opportunity), new MyOpportunityRequestValidatorVerifyFinalizeBatch(users.Object, opportunity),
          new MyOpportunityRequestValidatorVerifyImportCsv(Organizations.Object), new MyOpportunityRequestValidatorVerifyImportPartnerSync(countries), Mock.Of<IMediator>(),
          Mock.Of<IRepositoryBatchedWithNavigationAndCustomFieldFilter<Domain.MyOpportunity.Models.MyOpportunity>>(),
          Mock.Of<IRepository<MyOpportunityVerification>>(), Mock.Of<IExecutionStrategyService>());
      }
    }
    #endregion
  }
}
