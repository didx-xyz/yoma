using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Services;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;

namespace Yoma.Core.Test.Completion
{
  public class OrganizationRewardTests
  {
    #region Tests
    [Theory]
    [InlineData(0)]
    [InlineData(10)]
    public async Task AllocationUpdatesLifetimeAndYearTotalsWithoutMetadataWrite(int amount)
    {
      var fixture = new Fixture();

      await fixture.Service.AllocateRewards(fixture.Item, amount);

      Assert.Equal(50m + amount, fixture.Item.ZltoRewardCumulative);
      Assert.Equal(20m + amount, fixture.Item.ZltoRewardCumulativeCurrentFinancialYear);
      fixture.Repository.Verify(repository => repository.UpdateTrackingTotals(fixture.Item), Times.Once);
      fixture.Repository.Verify(repository => repository.Update(It.IsAny<Organization>()), Times.Never);
    }

    [Fact]
    public async Task UnconfiguredRewardDoesNotWrite()
    {
      var fixture = new Fixture();

      await fixture.Service.AllocateRewards(fixture.Item, null);

      fixture.Repository.VerifyNoOtherCalls();
      Assert.Equal(50m, fixture.Item.ZltoRewardCumulative);
      Assert.Equal(20m, fixture.Item.ZltoRewardCumulativeCurrentFinancialYear);
    }

    [Fact]
    public async Task NegativeRewardIsStillRejected()
    {
      var fixture = new Fixture();

      await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => fixture.Service.AllocateRewards(fixture.Item, -1));

      fixture.Repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task YearResetPreservesLifetimeTotalsAndUsesOnlyTheTotalsWriter()
    {
      var fixture = new Fixture();

      await fixture.Service.ResetRewardCumulativesCurrentFinancialYear(true);

      Assert.Equal(50m, fixture.Item.ZltoRewardCumulative);
      Assert.Equal(0m, fixture.Item.ZltoRewardCumulativeCurrentFinancialYear);
      fixture.Repository.Verify(repository => repository.UpdateTrackingTotals(It.Is<List<Organization>>(items => items.Count == 1 && items[0] == fixture.Item)), Times.Once);
      fixture.Repository.Verify(repository => repository.Update(It.IsAny<List<Organization>>()), Times.Never);
    }
    #endregion

    #region Fixture
    private sealed class Fixture
    {
      internal Organization Item { get; } = new() { Id = Guid.NewGuid(), ZltoRewardCumulative = 50m, ZltoRewardCumulativeCurrentFinancialYear = 20m };
      internal Mock<IRepositoryBatchedValueContainsWithNavigationAndTrackingTotals<Organization>> Repository { get; } = new();
      internal OrganizationService Service { get; }

      internal Fixture()
      {
        Repository.Setup(repository => repository.Query(LockMode.Wait)).Returns(new[] { Item }.AsQueryable());
        var users = new Mock<IUserService>();
        users.Setup(service => service.GetByUsername(It.IsAny<string>(), false, false)).Returns(new User { Id = Guid.NewGuid() });
        var identity = new Mock<IIdentityProviderClientFactory>();
        identity.Setup(factory => factory.CreateClient()).Returns(Mock.Of<IIdentityProviderClient>());
        var countries = Mock.Of<ICountryService>();
        var providers = Mock.Of<IOrganizationProviderTypeService>();

        Service = new OrganizationService(NullLogger<OrganizationService>.Instance, Options.Create(new AppSettings()), new HttpContextAccessor(),
          users.Object, identity.Object, Mock.Of<IOrganizationStatusService>(), providers, Mock.Of<IBlobService>(), Mock.Of<ISSITenantService>(),
          Mock.Of<INotificationURLFactory>(), Mock.Of<INotificationDeliveryService>(), Mock.Of<ISettingsDefinitionService>(),
          new OrganizationRequestValidatorCreate(countries, providers), new OrganizationRequestValidatorUpdate(countries, providers),
          new OrganizationSearchFilterValidator(), new OrganizationRequestUpdateStatusValidator(), new SettingsRequestValidator(), Mock.Of<IMediator>(),
          Repository.Object, Mock.Of<IRepository<OrganizationUser>>(), Mock.Of<IRepository<OrganizationProviderType>>(),
          Mock.Of<IRepository<OrganizationDocument>>(), Mock.Of<IExecutionStrategyService>());
      }
    }
    #endregion
  }
}
