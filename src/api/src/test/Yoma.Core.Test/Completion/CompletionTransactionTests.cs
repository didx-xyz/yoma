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
using Yoma.Core.Domain.BlobProvider;
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
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;
using Participation = Yoma.Core.Domain.MyOpportunity.Models.MyOpportunity;
using OpportunityModel = Yoma.Core.Domain.Opportunity.Models.Opportunity;

namespace Yoma.Core.Test.Completion
{
  public class CompletionTransactionTests
  {
    #region Tests
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
    }

    [Fact]
    public async Task FailedApprovalRequestsCleanupBeforeBatchContinues()
    {
      var fixture = new Fixture();
      fixture.UserService.Setup(service => service.AssignSkills(fixture.Users[0], fixture.Opportunity))
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
        VerificationMethod = VerificationMethod.Automatic
      };
      internal LinkInfo Link { get; } = new() { Id = Guid.NewGuid(), EntityType = ActionLinkEntityType.Opportunity, Action = LinkAction.Verify };
      internal Mock<IUserService> UserService { get; } = new();
      internal Mock<IOpportunityService> Opportunities { get; } = new();
      internal List<bool> CleanupRequests { get; } = [];
      internal List<bool> OwnedCleanupRequests { get; } = [];
      internal bool RollBackFirstOwnedExecution { get; set; }
      internal MyOpportunityService Service { get; }

      internal Fixture()
      {
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
        UserService.Setup(service => service.GetByUsername(It.IsAny<string>(), false, false)).Returns(Users[0]);
        Users[0].ExternalId = Guid.NewGuid();
        UserService.Setup(service => service.GetByUsernameOrNull(Users[0].Username, false, false)).Returns(Users[0]);
        Opportunities.Setup(service => service.GetById(It.IsAny<Guid>(), It.IsAny<bool>(), It.IsAny<bool>(), false, null)).Returns(Opportunity);
        Opportunities.Setup(service => service.GetByIdOrNull(Opportunity.Id, false, false, false, null)).Returns(Opportunity);
        Opportunities.Setup(service => service.GetByExternalId(Opportunity.OrganizationId, "external-id", true, true)).Returns(Opportunity);
        Opportunities.Setup(service => service.AllocateRewards(Opportunity.Id, It.IsAny<bool>(), It.IsAny<bool>()))
          .ReturnsAsync(new OpportunityAllocateRewardResponse { Opportunity = Opportunity });
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

        Service = new MyOpportunityService(NullLogger<MyOpportunityService>.Instance, Options.Create(new AppSettings()), http,
          UserService.Object, organizations.Object, Opportunities.Object, actions.Object, statuses.Object, Mock.Of<IOpportunityStatusService>(), Mock.Of<IOrganizationStatusService>(),
          Mock.Of<IBlobService>(), Mock.Of<ISSICredentialService>(), Mock.Of<IRewardService>(), links.Object,
          Mock.Of<INotificationURLFactory>(), Mock.Of<INotificationDeliveryService>(), countries, Mock.Of<IGenderService>(), intervals,
          Mock.Of<IDownloadService>(), Mock.Of<IOpportunityVerificationTypeService>(), Mock.Of<IDelayedExecutionService>(),
          Mock.Of<ISyncUserAuthenticationService>(), Mock.Of<ISyncStateService>(), Mock.Of<IProcessingService>(), Mock.Of<ICustomFieldDefinitionService>(), Mock.Of<ICustomFieldValueService>(),
          new MyOpportunitySearchFilterVerificationFilesAdminValidator(), new MyOpportunitySearchFilterAdminValidator(), new MyOpportunityRequestValidatorVerify(intervals, countries),
          new MyOpportunityRequestValidatorVerifyFinalize(UserService.Object, Opportunities.Object), new MyOpportunityRequestValidatorVerifyFinalizeBatch(UserService.Object, Opportunities.Object),
          new MyOpportunityRequestValidatorVerifyImportCsv(organizations.Object), new MyOpportunityRequestValidatorVerifyImportPartnerSync(countries), Mock.Of<IMediator>(),
          repository.Object, Mock.Of<IRepository<MyOpportunityVerification>>(), execution.Object);
      }

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
