using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Transactions;
using Xunit;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.Opportunity.Validators;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.Treasury.Interfaces;
using OpportunityModel = Yoma.Core.Domain.Opportunity.Models.Opportunity;

namespace Yoma.Core.Test.Completion
{
  public class CompletionRewardTests
  {
    #region Tests
    [Theory]
    [InlineData(20, 100, 100, 100, 20)]
    [InlineData(20, 5, 100, 100, 5)]
    [InlineData(20, 100, 5, 100, 5)]
    [InlineData(20, 100, 100, 5, 5)]
    [InlineData(20, 0, 100, 100, 0)]
    [InlineData(0, 100, 100, 100, 0)]
    [InlineData(null, 100, 100, 100, null)]
    public async Task CompletionPreservesRewardCapsAndUsesOnlyTheTotalsWriter(int? reward,
      int treasuryPool, int organizationPool, int opportunityPool, int? expected)
    {
      var fixture = new Fixture();
      fixture.Item.ZltoReward = reward;
      fixture.Item.ZltoRewardPool = opportunityPool;
      fixture.Organization.ZltoRewardPoolCurrentFinancialYear = organizationPool;
      fixture.Treasury.ZltoRewardPoolCurrentFinancialYear = treasuryPool;

      var result = await fixture.Service.AllocateRewards(fixture.Item.Id, false);

      Assert.Equal((decimal?)expected, result.ZltoReward);
      Assert.Equal(6, result.Opportunity.ParticipantCount);
      Assert.Equal(expected ?? 0m, result.Opportunity.ZltoRewardCumulative);
      fixture.Repository.Verify(repository => repository.UpdateTrackingTotals(fixture.Item), Times.Once);
      fixture.Repository.Verify(repository => repository.Update(It.IsAny<OpportunityModel>()), Times.Never);
      fixture.Organizations.Verify(service => service.AllocateRewards(fixture.Organization, expected), Times.Once);
      fixture.Treasuries.Verify(service => service.ZltoRewardAwarded(fixture.Treasury, expected), Times.Once);
      Assert.Equal([true], fixture.CleanupRequests);
    }

    [Fact]
    public async Task ParticipantLimitStillRejectsBeforeAnyRewardWrite()
    {
      var fixture = new Fixture();
      fixture.Item.ParticipantLimit = 5;

      await Assert.ThrowsAsync<FluentValidation.ValidationException>(() => fixture.Service.AllocateRewards(fixture.Item.Id, false));

      fixture.Repository.Verify(repository => repository.UpdateTrackingTotals(It.IsAny<OpportunityModel>()), Times.Never);
      fixture.Treasuries.Verify(service => service.Get(It.IsAny<LockMode?>()), Times.Never);
      Assert.Equal([true], fixture.CleanupRequests);
    }

    [Fact]
    public async Task NestedAllocationLeavesTrackingCleanupToTheOuterCompletionTransaction()
    {
      var fixture = new Fixture();
      using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

      await fixture.Service.AllocateRewards(fixture.Item.Id, false);

      Assert.Equal([false], fixture.CleanupRequests);
      scope.Complete();
    }

    [Fact]
    public async Task PersistenceFailureStillRequestsCleanupAndPropagates()
    {
      var fixture = new Fixture();
      var failure = new InvalidOperationException("Allocation persistence failed");
      fixture.Repository.Setup(repository => repository.UpdateTrackingTotals(It.IsAny<OpportunityModel>())).ThrowsAsync(failure);

      Assert.Same(failure, await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Service.AllocateRewards(fixture.Item.Id, false)));
      Assert.Equal([true], fixture.CleanupRequests);
    }
    #endregion

    #region Fixture
    private sealed class Fixture
    {
      internal OpportunityModel Item { get; } = new()
      {
        Id = Guid.NewGuid(),
        OrganizationId = Guid.NewGuid(),
        Title = "Completion reward regression",
        Status = Domain.Opportunity.Status.Active,
        OrganizationStatus = OrganizationStatus.Active,
        DateStart = DateTimeOffset.UtcNow.AddDays(-10),
        ParticipantCount = 5,
        ZltoReward = 20m,
        ZltoRewardCumulative = 0m
      };
      internal Organization Organization { get; } = new() { ZltoRewardCumulativeCurrentFinancialYear = 0m };
      internal Domain.Treasury.Models.Treasury Treasury { get; } = new() { ZltoRewardCumulativeCurrentFinancialYear = 0m };
      internal Mock<IRepositoryBatchedValueContainsWithNavigationAndCustomFieldFilterAndTrackingTotals<OpportunityModel>> Repository { get; } = new();
      internal Mock<IOrganizationService> Organizations { get; } = new();
      internal Mock<ITreasuryService> Treasuries { get; } = new();
      internal List<bool> CleanupRequests { get; } = [];
      internal OpportunityService Service { get; }

      internal Fixture()
      {
        Repository.Setup(repository => repository.Query(false, LockMode.Wait)).Returns(new[] { Item }.AsQueryable());
        Repository.Setup(repository => repository.UpdateTrackingTotals(It.IsAny<OpportunityModel>()))
          .ReturnsAsync((OpportunityModel item) => item);
        Organizations.Setup(service => service.GetById(Item.OrganizationId, false, true, false, LockMode.Wait)).Returns(Organization);
        Treasuries.Setup(service => service.Get(LockMode.Wait)).Returns(Treasury);
        var users = new Mock<IUserService>();
        users.Setup(service => service.GetByUsername(It.IsAny<string>(), false, false)).Returns(new User { Id = Guid.NewGuid() });
        var execution = new Mock<IExecutionStrategyService>();
        execution.Setup(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), It.IsAny<bool>()))
          .Returns((Func<Task> body, bool clear) =>
          {
            CleanupRequests.Add(clear);
            return body();
          });
        var identity = new Mock<IIdentityProviderClientFactory>();
        identity.Setup(factory => factory.CreateClient()).Returns(Mock.Of<IIdentityProviderClient>());
        var types = Mock.Of<IOpportunityTypeService>();
        var difficulty = Mock.Of<IOpportunityDifficultyService>();
        var engagement = Mock.Of<IEngagementTypeService>();
        var intervals = Mock.Of<ITimeIntervalService>();
        var categories = Mock.Of<IOpportunityCategoryService>();
        var countries = Mock.Of<ICountryService>();
        var languages = Mock.Of<ILanguageService>();
        var skills = Mock.Of<ISkillService>();
        var verificationTypes = Mock.Of<IOpportunityVerificationTypeService>();

        Service = new OpportunityService(NullLogger<OpportunityService>.Instance, Options.Create(new AppSettings()), new HttpContextAccessor(),
          Mock.Of<IOpportunityStatusService>(), categories, countries, Organizations.Object, Mock.Of<IOrganizationStatusService>(), types,
          languages, skills, difficulty, engagement, verificationTypes, intervals, Mock.Of<IBlobService>(), users.Object,
          Mock.Of<INotificationURLFactory>(), Mock.Of<INotificationDeliveryService>(), identity.Object, Mock.Of<ISyncStateService>(),
          Treasuries.Object, Mock.Of<IPartnerService>(), Mock.Of<ICustomFieldDefinitionService>(), Mock.Of<ICustomFieldValueService>(),
          Mock.Of<ISSISchemaService>(),
          new OpportunityRequestValidatorCreate(types, Organizations.Object, difficulty, engagement, intervals, categories, countries, languages, skills, verificationTypes),
          new OpportunityRequestValidatorUpdate(types, Organizations.Object, difficulty, engagement, intervals, categories, countries, languages, skills, verificationTypes),
          new OpportunitySearchFilterValidator(), new OpportunitySearchFilterCriteriaValidator(Organizations.Object), Mock.Of<IMediator>(),
          Repository.Object, Mock.Of<IRepository<OpportunityCategory>>(), Mock.Of<IRepository<OpportunityCountry>>(),
          Mock.Of<IRepository<OpportunityLanguage>>(), Mock.Of<IRepository<OpportunitySkill>>(), Mock.Of<IRepository<OpportunityVerificationType>>(), execution.Object);
      }
    }
    #endregion
  }
}
