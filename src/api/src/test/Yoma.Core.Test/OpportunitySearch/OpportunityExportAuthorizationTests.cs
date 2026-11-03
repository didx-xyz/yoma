using Microsoft.AspNetCore.Http;
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
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.Treasury.Interfaces;

namespace Yoma.Core.Test.OpportunitySearch
{
  public class OpportunityExportAuthorizationTests
  {
    #region Tests
    [Fact]
    public async Task ChecksSelectedOrganizationsBeforeSavingTheSameFilter()
    {
      var fixture = new Fixture();
      var filter = new OpportunitySearchFilterAdmin { Organizations = new() { Value = [fixture.Organization] } };
      var authorized = false;
      fixture.Organizations.Setup(service => service.IsAdminsOf(filter.Organizations.Value, true))
        .Callback(() => authorized = true).Returns(true);
      fixture.Download.Setup(service => service.Schedule(fixture.User.Id, DownloadScheduleType.Opportunities, filter))
        .Callback(() => Assert.True(authorized)).Returns(Task.CompletedTask);

      var (scheduleForProcessing, fileName, bytes) = await fixture.Service.ExportOrScheduleToCSV(filter, true);

      Assert.True(scheduleForProcessing);
      fixture.Download.Verify(service => service.Schedule(fixture.User.Id, DownloadScheduleType.Opportunities, filter), Times.Once);
    }

    [Fact]
    public async Task UnauthorizedSelectionIsNotScheduled()
    {
      var fixture = new Fixture();
      fixture.Organizations.Setup(service => service.IsAdminsOf(It.IsAny<List<Guid>>(), true))
        .Throws(new SecurityException("Unauthorized"));

      await Assert.ThrowsAsync<SecurityException>(() => fixture.Service.ExportOrScheduleToCSV(new()
      {
        Organizations = new() { Value = [Guid.NewGuid()] }
      }, true));

      fixture.Download.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task MissingOrEmptySelectionStoresPermittedOrganizationsAtTheRoot(bool empty)
    {
      var fixture = new Fixture();
      var filter = new OpportunitySearchFilterAdmin
      {
        Organizations = empty ? new() { Value = [] } : null,
        Groups = [new() { AnyOf = [new() { Organizations = new() { Value = [Guid.NewGuid()] } }] }]
      };
      fixture.Download.Setup(service => service.Schedule(fixture.User.Id, DownloadScheduleType.Opportunities, filter))
        .Callback(() =>
        {
          // Exercise the same normalization and serialization as DownloadService.Schedule.
          _ = HashHelper.ComputeSHA256Hash(filter);
          var saved = JsonConvert.DeserializeObject<OpportunitySearchFilterAdmin>(JsonConvert.SerializeObject(filter))!;
          Assert.Equal([fixture.Organization], saved.Organizations!.Value);
          Assert.Single(saved.Groups!);
        }).Returns(Task.CompletedTask);

      await fixture.Service.ExportOrScheduleToCSV(filter, true);

      fixture.Download.Verify(service => service.Schedule(fixture.User.Id, DownloadScheduleType.Opportunities, filter), Times.Once);
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
      var filter = new OpportunitySearchFilterAdmin();

      await fixture.Service.ExportOrScheduleToCSV(filter, ensureAuthorization);

      Assert.Null(filter.Organizations);
      fixture.Organizations.Verify(service => service.ListAdminsOf(false), Times.Never);
      fixture.Organizations.Verify(service => service.IsAdminsOf(It.IsAny<List<Guid>>(), It.IsAny<bool>()), Times.Never);
      fixture.Download.Verify(service => service.Schedule(fixture.User.Id, DownloadScheduleType.Opportunities, filter), Times.Once);
    }
    #endregion

    #region Fixture
    private sealed class Fixture
    {
      internal User User { get; } = new() { Id = Guid.NewGuid(), Username = "export-user" };
      internal Guid Organization { get; } = Guid.NewGuid();
      internal Mock<IOrganizationService> Organizations { get; } = new();
      internal Mock<IDownloadService> Download { get; } = new();
      internal OpportunityInfoService Service { get; }

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
        users.Setup(service => service.GetByUsername(User.Username, false, false)).Returns(User);
        Organizations.Setup(service => service.ListAdminsOf(false)).Returns([new OrganizationInfoAdmin { Id = Organization }]);
        Service = new OpportunityInfoService(Options.Create(new AppSettings()), accessor, Mock.Of<IOpportunityService>(),
          Mock.Of<IMyOpportunityService>(), Mock.Of<ILinkService>(), users.Object, Download.Object,
          Mock.Of<ITreasuryService>(), Organizations.Object);
      }
    }
    #endregion
  }
}
