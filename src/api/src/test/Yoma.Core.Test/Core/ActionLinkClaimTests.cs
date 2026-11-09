using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;
using Xunit;
using Yoma.Core.Domain.ActionLink;
using Yoma.Core.Domain.ActionLink.Interfaces.Lookups;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.ActionLink.Services;
using Yoma.Core.Domain.ActionLink.Validators;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Test.Referral.Fixtures;

namespace Yoma.Core.Test.Core
{
  public class ActionLinkClaimTests
  {
    [Theory]
    [InlineData(false, false, false)]
    [InlineData(false, true, true)]
    [InlineData(false, true, false)]
    [InlineData(true, false, false)]
    public void SearchRequiresMembershipUnlessTheCallerIsASystemAdmin(bool systemAdmin, bool hasMembership, bool matchingOrganization)
    {
      using var fixture = new Fixture();
      fixture.Accessor.HttpContext!.User = new ClaimsPrincipal(new ClaimsIdentity([
        new Claim(ClaimTypes.Role, systemAdmin ? Constants.Role_Admin : Constants.Role_OrganizationAdmin)], "test"));
      fixture.Link.OpportunityOrganizationId = Guid.NewGuid();
      fixture.Organizations.Setup(service => service.ListAdminsOf(false)).Returns(hasMembership
        ? [new OrganizationInfoAdmin { Id = matchingOrganization ? fixture.Link.OpportunityOrganizationId.Value : Guid.NewGuid() }] : []);
      var filter = new LinkSearchFilter { EntityType = ActionLinkEntityType.Opportunity };

      if (!systemAdmin && !hasMembership)
        Assert.Throws<SecurityException>(() => fixture.Service.Search(filter, true));
      else if (!systemAdmin && !matchingOrganization)
        Assert.Empty(fixture.Service.Search(filter, true).Items);
      else
        Assert.Equal(fixture.Link.Id, Assert.Single(fixture.Service.Search(filter, true).Items).Id);
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public async Task DistributionListRequiresAConfirmedMatchingContact(bool emailConfirmed, bool phoneConfirmed)
    {
      using var fixture = new Fixture();
      fixture.Link.LockToDistributionList = true;
      fixture.Link.DistributionList = "[\"participant@example.org\",\"+27820000000\"]";
      fixture.User.EmailConfirmed = emailConfirmed;
      fixture.User.PhoneNumberConfirmed = phoneConfirmed;

      if (emailConfirmed || phoneConfirmed)
      {
        await fixture.Service.LogUsage(fixture.Link.Id);
        var usage = Assert.Single(fixture.Usages);
        Assert.Equal(fixture.User.Id, usage.UserId);
        Assert.Equal(fixture.User.Username, usage.UsernameClaimed);
        Assert.Equal(fixture.Link.Id, usage.LinkId);
      }
      else
      {
        await Assert.ThrowsAsync<SecurityException>(() => fixture.Service.LogUsage(fixture.Link.Id));
        Assert.Empty(fixture.Usages);
      }
    }

    [Fact]
    public async Task ClaimRechecksCurrentStatusAfterAcquiringTheLock()
    {
      using var fixture = new Fixture();
      fixture.Links.Setup(repository => repository.Query(LockMode.Wait)).Returns(() =>
      {
        fixture.Link.Status = ActionLinkStatus.LimitReached;
        return new[] { fixture.Link }.AsQueryable();
      });

      await Assert.ThrowsAsync<ValidationException>(() => fixture.Service.LogUsage(fixture.Link.Id));

      Assert.Empty(fixture.Usages);
      fixture.Links.Verify(repository => repository.Update(It.IsAny<Link>()), Times.Never);
    }

    [Fact]
    public async Task ClaimUsesTheLockedUsageTotalInsteadOfTheEarlierSnapshot()
    {
      using var fixture = new Fixture();
      fixture.Link.UsagesLimit = 2;
      fixture.Links.Setup(repository => repository.Query(LockMode.Wait)).Returns(() =>
      {
        fixture.Link.UsagesTotal = 1;
        return new[] { fixture.Link }.AsQueryable();
      });

      var result = await fixture.Service.LogUsage(fixture.Link.Id);

      Assert.Equal(2, result.UsagesTotal);
      Assert.Equal(ActionLinkStatus.LimitReached, result.Status);
      var usage = Assert.Single(fixture.Usages);
      Assert.Equal(fixture.User.Id, usage.UserId);
      Assert.Equal(fixture.User.Username, usage.UsernameClaimed);
      Assert.Equal(fixture.Link.Id, usage.LinkId);
    }

    private sealed class Fixture : IDisposable
    {
      private readonly MemoryCache _cache = new(new MemoryCacheOptions());
      internal User User { get; } = new()
      {
        Id = Guid.NewGuid(),
        Username = "participant@example.org",
        Email = "participant@example.org",
        PhoneNumber = "+27820000000"
      };
      internal Link Link { get; } = new()
      {
        Id = Guid.NewGuid(),
        Action = LinkAction.Verify.ToString(),
        EntityType = ActionLinkEntityType.Opportunity.ToString(),
        Status = ActionLinkStatus.Active,
        OpportunityId = Guid.NewGuid(),
        OpportunityTitle = "Opportunity"
      };
      internal List<LinkUsageLog> Usages { get; } = [];
      internal Mock<IRepositoryBatchedValueContainsWithUnnested<Link>> Links { get; } = new();
      internal IHttpContextAccessor Accessor { get; } = MockHttpContextAccessor.Create().Object;
      internal Mock<IOrganizationService> Organizations { get; } = new();
      internal LinkService Service { get; }

      internal Fixture()
      {
        Links.Setup(repository => repository.Query()).Returns(new[] { Link }.AsQueryable());
        Links.Setup(repository => repository.Query(LockMode.Wait)).Returns(new[] { Link }.AsQueryable());
        Links.Setup(repository => repository.Update(It.IsAny<Link>())).ReturnsAsync((Link link) => link);
        var usages = new Mock<IRepositoryValueContains<LinkUsageLog>>();
        usages.Setup(repository => repository.Query()).Returns(Usages.AsQueryable());
        usages.Setup(repository => repository.Create(It.IsAny<LinkUsageLog>())).ReturnsAsync((LinkUsageLog usage) =>
        {
          Usages.Add(usage);
          return usage;
        });
        var users = new Mock<IUserService>();
        users.Setup(service => service.GetCurrentUser(false, false, It.IsAny<bool>())).Returns(User);
        var strategy = new Mock<IExecutionStrategyService>();
        strategy.Setup(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), true))
          .Returns((Func<Task> action, bool _) => action());
        var statuses = new Mock<ILinkStatusService>();
        statuses.Setup(service => service.GetByName(ActionLinkStatus.LimitReached.ToString()))
          .Returns(new Domain.ActionLink.Models.Lookups.LinkStatus { Id = Guid.NewGuid() });
        Service = new LinkService(NullLogger<LinkService>.Instance, Options.Create(new AppSettings()), _cache,
          Accessor, Mock.Of<IShortLinkProviderClientFactory>(), users.Object,
          Organizations.Object, statuses.Object, Mock.Of<IOpportunityService>(), Links.Object, usages.Object,
          Mock.Of<IRepositoryValueContainsWithNavigation<User>>(), strategy.Object, Mock.Of<INotificationDeliveryService>(),
          Mock.Of<INotificationURLFactory>(), new LinkRequestCreateValidatorShare(), new LinkRequestCreateValidatorVerify(),
          new LinkSearchFilterValidator(), new LinkSearchFilterUsageValidator());
      }

      public void Dispose() => _cache.Dispose();
    }
  }
}
