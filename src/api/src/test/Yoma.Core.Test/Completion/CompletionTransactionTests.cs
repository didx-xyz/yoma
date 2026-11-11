using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;
using System.Text;
using System.Transactions;
using Xunit;
using Yoma.Core.Domain.ActionLink;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Services;
using Yoma.Core.Domain.MyOpportunity.Validators;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Events;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;
using OpportunityModel = Yoma.Core.Domain.Opportunity.Models.Opportunity;
using Participation = Yoma.Core.Domain.MyOpportunity.Models.MyOpportunity;

namespace Yoma.Core.Test.Completion
{
  public class CompletionTransactionTests
  {
    #region Tests
    [Theory]
    [InlineData(VerificationStatus.Completed)]
    [InlineData(VerificationStatus.Rejected)]
    public async Task ManualFinalizationRequiresOrganizationAccessBeforeMutation(VerificationStatus status)
    {
      var fixture = new Fixture();
      fixture.Opportunities.Setup(service => service.GetById(fixture.Opportunity.Id, true, true, true, null))
        .Throws(new Domain.Core.Exceptions.SecurityException("Unauthorized"));
      var request = fixture.Request(fixture.Users[0]);
      request.Status = status;
      request.Comment = "Review outcome";

      await Assert.ThrowsAsync<Domain.Core.Exceptions.SecurityException>(() => fixture.Service.FinalizeVerificationManual(request));

      Assert.All(fixture.Items, item => Assert.Equal(VerificationStatus.Pending, item.VerificationStatus));
      Assert.Empty(fixture.CleanupRequests);
    }

    [Fact]
    public async Task ManualBatchChecksOrganizationAccessForEachItem()
    {
      var fixture = new Fixture();
      fixture.Opportunities.SetupSequence(service => service.GetById(fixture.Opportunity.Id, true, true, true, null))
        .Throws(new Domain.Core.Exceptions.SecurityException("Unauthorized"))
        .Returns(fixture.Opportunity);

      var result = await fixture.Service.FinalizeVerificationManual(new MyOpportunityRequestVerifyFinalizeBatch
      {
        Status = VerificationStatus.Rejected,
        Comment = "Review outcome",
        Items = [.. fixture.Users.Select(user => new MyOpportunityRequestVerifyFinalizeBatchItem
        {
          UserId = user.Id,
          OpportunityId = fixture.Opportunity.Id
        })]
      });

      Assert.Single(result.Items, item => item.Failure != null);
      Assert.Single(result.Items, item => item.Failure == null);
      Assert.Equal(VerificationStatus.Pending, fixture.Items[0].VerificationStatus);
      Assert.Equal(VerificationStatus.Rejected, fixture.Items[1].VerificationStatus);
      fixture.Opportunities.Verify(service => service.GetById(fixture.Opportunity.Id, true, true, true, null), Times.Exactly(2));
    }

    [Theory]
    [InlineData(",,,,,,,,external-id")]
    [InlineData("first@example.org,,,,,,,,")]
    public async Task CsvErrorsStopAtTheConfiguredBudgetBeforeDomainProcessing(string row)
    {
      var fixture = new Fixture();
      fixture.Settings.CSVImportMaxProbeErrorCount = 3;
      using var stream = new MemoryStream(Encoding.UTF8.GetBytes(
        "Email,PhoneNumber,FirstName,Surname,Gender,Country,DateCompleted,CountryCompleted,OpportunityExternalId\n" +
        string.Join('\n', Enumerable.Repeat(row, 30)) + "\n"));

      var result = await fixture.Service.PerformActionImportVerificationFromCSV(new MyOpportunityRequestVerifyImportCsv
      {
        OrganizationId = fixture.Opportunity.OrganizationId,
        File = new FormFile(stream, 0, stream.Length, "File", "completions.csv") { Headers = new HeaderDictionary(), ContentType = "text/csv" }
      }, false);

      Assert.False(result.Imported);
      Assert.Equal(3, result.RecordsTotal);
      Assert.Equal(3, result.RecordsFailed);
      Assert.Empty(fixture.CleanupRequests);
    }

    [Fact]
    public async Task ManualApprovalRequestsCleanupAndPreservesCompletionOutcome()
    {
      var fixture = new Fixture();

      await fixture.Service.FinalizeVerificationManual(fixture.Request(fixture.Users[0]));

      Assert.Equal([true], fixture.CleanupRequests);
      var completed = fixture.Items.Single(item => item.UserId == fixture.Users[0].Id);
      Assert.Equal(VerificationStatus.Completed, completed.VerificationStatus);
      Assert.NotNull(completed.DateCompleted);
      fixture.Opportunities.Verify(service => service.AllocateRewards(fixture.Opportunity.Id, true, false), Times.Once);
      fixture.VerifySkillsAssigned(fixture.Users[0], Times.Once());
    }

    [Theory]
    [InlineData(null)]
    [InlineData(0)]
    [InlineData(20)]
    public async Task ApprovalPreservesSkillsAndPublishesFreshTotalsRegardlessOfReward(int? reward)
    {
      var fixture = new Fixture();
      fixture.Allocation.ZltoReward = reward;
      Assert.Null(fixture.Allocation.Opportunity.Skills);

      await fixture.Service.FinalizeVerificationManual(fixture.Request(fixture.Users[0]));

      fixture.VerifySkillsAssigned(fixture.Users[0], Times.Once());
      Assert.Equal((decimal?)reward, fixture.Items[0].ZltoReward);
      fixture.Mediator.Verify(mediator => mediator.Publish(It.Is<OpportunityEvent>(value =>
        value.Entity.ParticipantCount == 6 && value.Entity.ZltoRewardCumulative == 120m), It.IsAny<CancellationToken>()), Times.Once);
      fixture.Rewards.Verify(service => service.ScheduleTransaction(fixture.Users[0].Id,
        Domain.Reward.RewardTransactionEntityType.MyOpportunity, fixture.Items[0].Id, It.IsAny<decimal>()),
        reward > 0 ? Times.Once() : Times.Never());
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ApprovalWithoutConfiguredSkillsStillCompletes(bool emptyList)
    {
      var fixture = new Fixture();
      fixture.Opportunity.Skills = emptyList ? [] : null;

      await fixture.Service.FinalizeVerificationManual(fixture.Request(fixture.Users[0]));

      Assert.Equal(VerificationStatus.Completed, fixture.Items[0].VerificationStatus);
      fixture.UserService.Verify(service => service.AssignSkills(fixture.Users[0],
        It.Is<OpportunityModel>(opportunity => opportunity.Skills == null || opportunity.Skills.Count == 0)), Times.Once);
    }

    [Fact]
    public async Task BatchApprovalPreservesSkillsForEachLearner()
    {
      var fixture = new Fixture();

      var result = await fixture.Service.FinalizeVerificationManual(new MyOpportunityRequestVerifyFinalizeBatch
      {
        Status = VerificationStatus.Completed,
        Items = [.. fixture.Users.Select(user => new MyOpportunityRequestVerifyFinalizeBatchItem
        {
          UserId = user.Id,
          OpportunityId = fixture.Opportunity.Id
        })]
      });

      Assert.All(result.Items, item => Assert.Null(item.Failure));
      foreach (var user in fixture.Users) fixture.VerifySkillsAssigned(user, Times.Once());
    }

    [Fact]
    public async Task FailedApprovalRequestsCleanupBeforeBatchContinues()
    {
      var fixture = new Fixture();
      fixture.UserService.Setup(service => service.AssignSkills(fixture.Users[0], It.IsAny<OpportunityModel>()))
        .ThrowsAsync(new InvalidOperationException("Downstream allocation failure"));

      var result = await fixture.Service.FinalizeVerificationManual(new MyOpportunityRequestVerifyFinalizeBatch
      {
        Status = VerificationStatus.Completed,
        Items = [.. fixture.Users.Select(user => new MyOpportunityRequestVerifyFinalizeBatchItem
        {
          UserId = user.Id,
          OpportunityId = fixture.Opportunity.Id
        })]
      });

      Assert.Equal([true, true], fixture.CleanupRequests);
      Assert.Single(result.Items, item => item.Failure != null);
      Assert.Single(result.Items, item => item.Failure == null);
      Assert.Equal(VerificationStatus.Pending, fixture.Items[0].VerificationStatus);
      Assert.Equal(VerificationStatus.Completed, fixture.Items[1].VerificationStatus);
    }

    [Fact]
    public async Task NestedApprovalDoesNotClearTrackingOwnedByItsCaller()
    {
      var fixture = new Fixture();
      using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

      await fixture.Service.FinalizeVerificationManual(fixture.Request(fixture.Users[0]));

      Assert.Equal([false], fixture.CleanupRequests);
      scope.Complete();
    }

    [Fact]
    public async Task CompletedVerificationStillCannotAllocateAgain()
    {
      var fixture = new Fixture();
      fixture.Items[0].VerificationStatus = VerificationStatus.Completed;

      await Assert.ThrowsAsync<FluentValidation.ValidationException>(() => fixture.Service.FinalizeVerificationManual(fixture.Request(fixture.Users[0])));

      fixture.Opportunities.Verify(service => service.AllocateRewards(It.IsAny<Guid>(), It.IsAny<bool>(), It.IsAny<bool>()), Times.Never);
      fixture.UserService.Verify(service => service.AssignSkills(It.IsAny<User>(), It.IsAny<OpportunityModel>()), Times.Never);
      Assert.Equal([true], fixture.CleanupRequests);
    }

    [Fact]
    public async Task RejectionStillDoesNotAllocateRewards()
    {
      var fixture = new Fixture();
      var request = fixture.Request(fixture.Users[0]);
      request.Status = VerificationStatus.Rejected;
      request.Comment = "Evidence not accepted";

      await fixture.Service.FinalizeVerificationManual(request);

      Assert.Equal(VerificationStatus.Rejected, fixture.Items[0].VerificationStatus);
      Assert.Null(fixture.Items[0].DateCompleted);
      fixture.Opportunities.Verify(service => service.AllocateRewards(It.IsAny<Guid>(), It.IsAny<bool>(), It.IsAny<bool>()), Times.Never);
      fixture.UserService.Verify(service => service.AssignSkills(It.IsAny<User>(), It.IsAny<OpportunityModel>()), Times.Never);
      Assert.Equal([true], fixture.CleanupRequests);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task PartnerImportOwnsCleanupAndKeepsItsProgressOutcome(bool complete)
    {
      var fixture = new Fixture();

      var result = await fixture.Service.PerformActionImportVerificationFromPartnerSync(new MyOpportunityRequestVerifyImportPartnerSync
      {
        OpportunityId = fixture.Opportunity.Id,
        UserId = fixture.Users[0].Id,
        Completed = complete,
        PercentComplete = complete ? 100m : 40m
      });

      Assert.True(result.Processed);
      Assert.False(result.Skipped);
      Assert.True(fixture.CleanupRequests[0]);
      Assert.All(fixture.CleanupRequests.Skip(1), clear => Assert.False(clear));
      Assert.Equal(complete ? VerificationStatus.Completed : VerificationStatus.Pending, fixture.Items[0].VerificationStatus);
      fixture.Opportunities.Verify(service => service.AllocateRewards(fixture.Opportunity.Id, false, true), complete ? Times.Once() : Times.Never());
      fixture.VerifySkillsAssigned(fixture.Users[0], complete ? Times.Once() : Times.Never());
    }

    [Fact]
    public async Task InstantCompletionOwnsCleanupAndKeepsItsOutcome()
    {
      var fixture = new Fixture();

      await fixture.Service.PerformActionInstantVerification(fixture.Link.Id);

      Assert.True(fixture.CleanupRequests[0]);
      Assert.All(fixture.CleanupRequests.Skip(1), clear => Assert.False(clear));
      Assert.Equal(VerificationStatus.Completed, fixture.Items[0].VerificationStatus);
      fixture.Opportunities.Verify(service => service.AllocateRewards(fixture.Opportunity.Id, false, false), Times.Once);
      fixture.VerifySkillsAssigned(fixture.Users[0], Times.Once());
    }

    [Fact]
    public async Task CsvValidationAndCommitBothOwnCleanupAndKeepTheCompletion()
    {
      var fixture = new Fixture { RollBackFirstOwnedExecution = true };
      fixture.Items[0].VerificationStatus = VerificationStatus.Rejected;
      using var stream = new MemoryStream(Encoding.UTF8.GetBytes(
        "Email,PhoneNumber,FirstName,Surname,Gender,Country,DateCompleted,CountryCompleted,OpportunityExternalId\n" +
        "first@example.org,,,,,,,,external-id\n"));
      var request = new MyOpportunityRequestVerifyImportCsv
      {
        OrganizationId = fixture.Opportunity.OrganizationId,
        File = new FormFile(stream, 0, stream.Length, "File", "completions.csv") { Headers = new HeaderDictionary(), ContentType = "text/csv" }
      };

      var result = await fixture.Service.PerformActionImportVerificationFromCSV(request, false);

      Assert.Equal([true, true], fixture.OwnedCleanupRequests);
      Assert.Equal(VerificationStatus.Completed, fixture.Items[0].VerificationStatus);
      Assert.NotNull(fixture.Items[0].DateCompleted);
      Assert.True(result.Imported);
      fixture.Opportunities.Verify(service => service.AllocateRewards(fixture.Opportunity.Id, false, true), Times.Exactly(2));
      fixture.VerifySkillsAssigned(fixture.Users[0], Times.Exactly(2));
    }
    #endregion

    #region Fixture
    private sealed class Fixture
    {
      private readonly Guid _actionId = Guid.NewGuid();
      private readonly Dictionary<VerificationStatus, Guid> _statusIds = Enum.GetValues<VerificationStatus>().ToDictionary(value => value, _ => Guid.NewGuid());
      private int _executionDepth;
      internal List<User> Users { get; } = [new() { Id = Guid.NewGuid(), Username = "first@example.org" }, new() { Id = Guid.NewGuid(), Username = "second@example.org" }];
      internal List<Participation> Items { get; } = [];
      internal OpportunityModel Opportunity { get; } = new()
      {
        Id = Guid.NewGuid(),
        OrganizationId = Guid.NewGuid(),
        Title = "Completion transaction regression",
        Published = true,
        Status = Status.Active,
        DateStart = DateTimeOffset.UtcNow.AddDays(-10),
        VerificationEnabled = true,
        VerificationMethod = VerificationMethod.Automatic,
        Skills = [new() { Id = Guid.NewGuid(), Name = "Communication" }, new() { Id = Guid.NewGuid(), Name = "Teamwork" }]
      };
      internal LinkInfo Link { get; } = new() { Id = Guid.NewGuid(), EntityType = ActionLinkEntityType.Opportunity, Action = LinkAction.Verify };
      internal Mock<IUserService> UserService { get; } = new();
      internal Mock<IOpportunityService> Opportunities { get; } = new();
      internal Mock<IRewardService> Rewards { get; } = new();
      internal Mock<IMediator> Mediator { get; } = new();
      internal OpportunityAllocateRewardResponse Allocation { get; }
      internal List<bool> CleanupRequests { get; } = [];
      internal List<bool> OwnedCleanupRequests { get; } = [];
      internal bool RollBackFirstOwnedExecution { get; set; }
      internal MyOpportunityService Service { get; }
      internal AppSettings Settings { get; } = new();

      internal Fixture()
      {
        // AllocateRewards reloads a separate projection without child items in Production.
        // Returning the original opportunity here would hide the missing-skills regression.
        var allocatedOpportunity = ObjectHelper.DeepCopy(Opportunity);
        allocatedOpportunity.Skills = null;
        allocatedOpportunity.ParticipantCount = 6;
        allocatedOpportunity.ZltoRewardCumulative = 120m;
        Allocation = new OpportunityAllocateRewardResponse { Opportunity = allocatedOpportunity };
        Link.EntityId = Opportunity.Id;
        Items.AddRange(Users.Select(user => new Participation
        {
          Id = Guid.NewGuid(),
          UserId = user.Id,
          Username = user.Username,
          OpportunityId = Opportunity.Id,
          OpportunityTitle = Opportunity.Title,
          ActionId = _actionId,
          VerificationStatusId = _statusIds[VerificationStatus.Pending],
          VerificationStatus = VerificationStatus.Pending
        }));
        UserService.Setup(service => service.GetById(It.IsAny<Guid>(), false, false)).Returns((Guid id, bool _, bool _) => Users.Single(user => user.Id == id));
        UserService.Setup(service => service.GetByIdOrNull(It.IsAny<Guid>(), false, false)).Returns((Guid id, bool _, bool _) => Users.SingleOrDefault(user => user.Id == id));
        UserService.Setup(service => service.GetCurrentUser(false, false, It.IsAny<bool>())).Returns(Users[0]);
        Users[0].ExternalId = Guid.NewGuid();
        UserService.Setup(service => service.GetByUsernameOrNull(Users[0].Username, false, false)).Returns(Users[0]);
        Opportunities.Setup(service => service.GetById(It.IsAny<Guid>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(), null)).Returns(Opportunity);
        Opportunities.Setup(service => service.GetByIdOrNull(Opportunity.Id, false, false, false, null)).Returns(Opportunity);
        Opportunities.Setup(service => service.GetByExternalId(Opportunity.OrganizationId, "external-id", true, true)).Returns(Opportunity);
        Opportunities.Setup(service => service.AllocateRewards(Opportunity.Id, It.IsAny<bool>(), It.IsAny<bool>()))
          .ReturnsAsync(Allocation);
        var repository = new Mock<IRepositoryBatchedWithNavigationAndCustomFieldFilter<Participation>>();
        IQueryable<Participation> Read() => Items.Select(item => ObjectHelper.DeepCopy(item)).AsQueryable();
        repository.Setup(value => value.Query(false, LockMode.Wait)).Returns(Read);
        repository.Setup(value => value.Query(false)).Returns(Read);
        repository.Setup(value => value.Query(true)).Returns(Read);
        repository.Setup(value => value.Update(It.IsAny<Participation>())).ReturnsAsync((Participation item) =>
        {
          item.VerificationStatus = _statusIds.Single(pair => pair.Value == item.VerificationStatusId).Key;
          Items[Items.FindIndex(existing => existing.Id == item.Id)] = ObjectHelper.DeepCopy(item);
          return item;
        });
        var actions = new Mock<IMyOpportunityActionService>();
        actions.Setup(service => service.GetByName(It.IsAny<string>())).Returns((string name) =>
          new Domain.MyOpportunity.Models.Lookups.MyOpportunityAction { Id = _actionId, Name = name });
        var statuses = new Mock<IMyOpportunityVerificationStatusService>();
        statuses.Setup(service => service.GetByName(It.IsAny<string>())).Returns((string name) =>
          new Domain.MyOpportunity.Models.Lookups.MyOpportunityVerificationStatus { Id = _statusIds[Enum.Parse<VerificationStatus>(name)], Name = name });
        var execution = new Mock<IExecutionStrategyService>();
        execution.Setup(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), It.IsAny<bool>()))
          .Returns(async (Func<Task> body, bool clear) =>
          {
            CleanupRequests.Add(clear);
            var ownsExecution = _executionDepth++ == 0;
            if (ownsExecution) OwnedCleanupRequests.Add(clear);
            // Simulate the CSV validation transaction's rollback without a database dependency.
            var snapshot = ownsExecution && RollBackFirstOwnedExecution ? ObjectHelper.DeepCopy(Items) : null;
            try
            {
              await body();
            }
            finally
            {
              _executionDepth--;
              if (snapshot != null)
              {
                Items.Clear();
                Items.AddRange(snapshot);
                RollBackFirstOwnedExecution = false;
              }
            }
          });
        var links = new Mock<ILinkService>();
        links.Setup(service => service.GetById(Link.Id, false, false)).Returns(Link);
        var http = new HttpContextAccessor
        {
          HttpContext = new DefaultHttpContext
          {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, Users[0].Username)], "Unit test"))
          }
        };
        var organizations = new Mock<IOrganizationService>();
        organizations.Setup(service => service.GetById(Opportunity.OrganizationId, false, false, false, null))
          .Returns(new Organization { Id = Opportunity.OrganizationId });
        organizations.Setup(service => service.GetByIdOrNull(Opportunity.OrganizationId, false, false, false, null))
          .Returns(new Organization { Id = Opportunity.OrganizationId });
        var intervals = Mock.Of<ITimeIntervalService>();
        var countries = Mock.Of<ICountryService>();

        Service = new MyOpportunityService(NullLogger<MyOpportunityService>.Instance, Options.Create(Settings), http,
          UserService.Object, organizations.Object, Opportunities.Object, actions.Object, statuses.Object, Mock.Of<IOpportunityStatusService>(), Mock.Of<IOrganizationStatusService>(),
          Mock.Of<IBlobService>(), Mock.Of<ISSICredentialService>(), Rewards.Object, links.Object,
          Mock.Of<INotificationURLFactory>(), Mock.Of<INotificationDeliveryService>(), countries, Mock.Of<IGenderService>(), intervals,
          Mock.Of<IDownloadService>(), Mock.Of<IOpportunityVerificationTypeService>(), Mock.Of<IDelayedExecutionService>(),
          Mock.Of<ISyncUserAuthenticationService>(), Mock.Of<ISyncStateService>(), Mock.Of<IProcessingService>(), Mock.Of<ICustomFieldDefinitionService>(), Mock.Of<ICustomFieldValueService>(),
          new MyOpportunitySearchFilterVerificationFilesAdminValidator(), new MyOpportunitySearchFilterAdminValidator(), new MyOpportunityRequestValidatorVerify(intervals, countries),
          new MyOpportunityRequestValidatorVerifyFinalize(UserService.Object, Opportunities.Object), new MyOpportunityRequestValidatorVerifyFinalizeBatch(UserService.Object, Opportunities.Object),
          new MyOpportunityRequestValidatorVerifyImportCsv(organizations.Object), new MyOpportunityRequestValidatorVerifyImportPartnerSync(countries), Mediator.Object,
          repository.Object, Mock.Of<IRepository<MyOpportunityVerification>>(), execution.Object);
      }

      internal void VerifySkillsAssigned(User user, Times times) =>
        UserService.Verify(service => service.AssignSkills(user, It.Is<OpportunityModel>(opportunity =>
          opportunity.Id == Opportunity.Id && opportunity.OrganizationId == Opportunity.OrganizationId &&
          opportunity.Skills != null && opportunity.Skills.Select(skill => skill.Id).SequenceEqual(Opportunity.Skills!.Select(skill => skill.Id)))), times);

      internal MyOpportunityRequestVerifyFinalize Request(User user) => new()
      {
        OpportunityId = Opportunity.Id,
        UserId = user.Id,
        Status = VerificationStatus.Completed
      };
    }
    #endregion
  }
}
