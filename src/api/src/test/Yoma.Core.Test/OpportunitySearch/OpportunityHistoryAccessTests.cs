using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;
using Xunit;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.Treasury.Interfaces;
using Yoma.Core.Domain.Treasury.Models;

namespace Yoma.Core.Test.OpportunitySearch
{
  public class OpportunityHistoryAccessTests
  {
    [Theory]
    [InlineData(VerificationStatus.None, false)]
    [InlineData(VerificationStatus.Rejected, false)]
    [InlineData(VerificationStatus.Pending, true)]
    [InlineData(VerificationStatus.Completed, true)]
    public void InactiveOpportunityRequiresParticipation(VerificationStatus status, bool allowed)
    {
      var fixture = new Fixture(status);

      if (allowed) Assert.Equal(fixture.Opportunity.Id, fixture.Service.GetById(fixture.Opportunity.Id, false).Id);
      else Assert.Throws<EntityNotFoundException>(() => fixture.Service.GetById(fixture.Opportunity.Id, false));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void GlobalOrOwningAdministratorCanReadInactiveOpportunity(bool globalAdmin)
    {
      var fixture = new Fixture(VerificationStatus.None, globalAdmin, !globalAdmin);

      Assert.Equal(fixture.Opportunity.Id, fixture.Service.GetById(fixture.Opportunity.Id, false).Id);
      fixture.Participation.Verify(service => service.GetVerificationStatus(It.IsAny<Guid>(), It.IsAny<User?>()), Times.Never);
    }

    [Theory]
    [InlineData(Status.Active)]
    [InlineData(Status.Expired)]
    public void PublicOpportunityDoesNotRequireParticipation(Status status)
    {
      var fixture = new Fixture(VerificationStatus.None);
      fixture.Opportunity.Status = status;

      Assert.Equal(fixture.Opportunity.Id, fixture.Service.GetById(fixture.Opportunity.Id, false).Id);
      fixture.Participation.Verify(service => service.GetVerificationStatus(It.IsAny<Guid>(), It.IsAny<User?>()), Times.Never);
    }

    private sealed class Fixture
    {
      internal Domain.Opportunity.Models.Opportunity Opportunity { get; } = new()
      {
        Id = Guid.NewGuid(),
        OrganizationId = Guid.NewGuid(),
        Status = Status.Inactive,
        OrganizationStatus = OrganizationStatus.Active
      };
      internal Mock<IMyOpportunityService> Participation { get; } = new();
      internal OpportunityInfoService Service { get; }

      internal Fixture(VerificationStatus status, bool globalAdmin = false, bool owningAdmin = false)
      {
        var accessor = new HttpContextAccessor
        {
          HttpContext = new DefaultHttpContext
          {
            User = new ClaimsPrincipal(new ClaimsIdentity([
              new Claim(ClaimTypes.Name, "participant@example.org"),
              new Claim(ClaimTypes.Role, globalAdmin ? Constants.Role_Admin : Constants.Role_User)], "test"))
          }
        };
        var opportunities = new Mock<IOpportunityService>();
        opportunities.Setup(service => service.GetById(Opportunity.Id, true, true, false, null)).Returns(Opportunity);
        var organizations = new Mock<IOrganizationService>();
        organizations.Setup(service => service.IsAdmin(Opportunity.OrganizationId, false)).Returns(owningAdmin);
        Participation.Setup(service => service.GetVerificationStatus(Opportunity.Id, (User?)null))
          .Returns(new MyOpportunityResponseVerifyStatus { Status = status });
        Participation.Setup(service => service.Search(It.IsAny<MyOpportunitySearchFilterAdmin>(), false))
          .Returns(new MyOpportunitySearchResults());
        var treasury = new Mock<ITreasuryService>();
        treasury.Setup(service => service.GetInfo()).Returns(new TreasuryInfo());
        Service = new OpportunityInfoService(Options.Create(new AppSettings { AppBaseURL = "https://example.org" }), accessor,
          opportunities.Object, Participation.Object, Mock.Of<ILinkService>(), Mock.Of<IUserService>(),
          Mock.Of<IDownloadService>(), treasury.Object, organizations.Object);
      }
    }
  }
}
