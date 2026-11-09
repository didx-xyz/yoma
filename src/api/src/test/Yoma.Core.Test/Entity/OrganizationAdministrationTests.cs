using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;
using System.Transactions;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Services;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;
using OrganizationProviderType = Yoma.Core.Domain.Entity.Models.OrganizationProviderType;
using SettingsDefinition = Yoma.Core.Domain.Entity.Models.Lookups.SettingsDefinition;

namespace Yoma.Core.Test.Entity
{
  public class OrganizationAdministrationTests
  {
    #region Tests
    [Theory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    public void SearchRequiresMembershipUnlessTheCallerIsASystemAdmin(bool systemAdmin, bool hasMembership)
    {
      var fixture = new Fixture();
      fixture.Accessor.HttpContext!.User = new ClaimsPrincipal(new ClaimsIdentity([
        new Claim(ClaimTypes.Role, systemAdmin ? Domain.Core.Constants.Role_Admin : Domain.Core.Constants.Role_OrganizationAdmin)], "test"));
      if (hasMembership)
        fixture.Members.Add(new OrganizationUser { OrganizationId = fixture.Item.Id, UserId = fixture.User.Id });
      var filter = new OrganizationSearchFilter { PageNumber = 1, PageSize = 10 };

      if (!systemAdmin && !hasMembership)
        Assert.Throws<Domain.Core.Exceptions.SecurityException>(() => fixture.Service.Search(filter, true));
      else
        Assert.Equal(fixture.Item.Id, Assert.Single(fixture.Service.Search(filter, true).Items!).Id);
    }

    [Fact]
    public async Task CreationDocumentFailureAfterAssigningMembershipDoesNotGrantRoles()
    {
      var fixture = new Fixture();
      fixture.Blobs.Setup(service => service.Create(FileType.Documents, StorageType.Private, It.IsAny<IFormFile>(), null))
        .ThrowsAsync(new Domain.Core.Exceptions.BusinessException("Document rejected"));
      var document = FileHelper.FromByteArray("registration.pdf", "application/pdf", [1, 2, 3]);
      var request = new OrganizationRequestCreate
      {
        Name = "New organization",
        PrimaryContactName = "Test Admin",
        PrimaryContactEmail = "admin@example.invalid",
        PrimaryContactPhone = "+27821234567",
        City = "Test City",
        CountryId = fixture.CountryId,
        StreetAddress = "Test Street",
        Province = "Test Province",
        PostalCode = "0001",
        ProviderTypes = [fixture.ProviderTypeId],
        AddCurrentUserAsAdmin = true,
        RegistrationDocuments = [document]
      };

      await Assert.ThrowsAsync<Domain.Core.Exceptions.BusinessException>(() => fixture.Service.Create(request));

      fixture.MembersRepository.Verify(repository => repository.Create(It.IsAny<OrganizationUser>()), Times.Once);
      fixture.Identity.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RolesAreGrantedInlineAfterTheMembershipTransaction()
    {
      var fixture = new Fixture();
      fixture.Identity.Setup(client => client.EnsureRoles(fixture.User.ExternalId!.Value, It.IsAny<List<string>>()))
        .Callback(() => Assert.Null(Transaction.Current)).Returns(Task.CompletedTask);

      await fixture.Service.AssignAdmins(fixture.Item.Id, [fixture.User.Username], true);

      Assert.Single(fixture.Members);
      fixture.Identity.Verify(client => client.EnsureRoles(fixture.User.ExternalId!.Value, It.IsAny<List<string>>()), Times.Once);
    }

    [Fact]
    public async Task AssigningAnAdministratorDoesNotReconcileUnrelatedAdministrators()
    {
      var fixture = new Fixture();
      var existingAdmin = new UserInfo { Id = Guid.NewGuid(), Username = "existing@example.invalid" };
      fixture.Item.Administrators = [existingAdmin];
      fixture.Members.Add(new OrganizationUser { OrganizationId = fixture.Item.Id, UserId = existingAdmin.Id });

      await fixture.Service.AssignAdmins(fixture.Item.Id, [fixture.User.Username], true);

      Assert.Equal(2, fixture.Members.Count);
      fixture.Identity.Verify(client => client.EnsureRoles(fixture.User.ExternalId!.Value, It.IsAny<List<string>>()), Times.Once);
      fixture.Identity.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DatabaseFailureDoesNotGrantRoles()
    {
      var fixture = new Fixture();
      fixture.Repository.Setup(repository => repository.Update(It.IsAny<Organization>()))
        .ThrowsAsync(new InvalidOperationException("Persistence failed"));

      await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Service.AssignAdmins(fixture.Item.Id, [fixture.User.Username], true));

      fixture.Identity.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task TransactionCommitFailureDoesNotChangeExternalRoles(bool remove)
    {
      var fixture = new Fixture();
      if (remove)
      {
        fixture.Members.Add(new OrganizationUser { OrganizationId = fixture.Item.Id, UserId = fixture.User.Id });
        fixture.Item.Administrators = [new UserInfo { Id = fixture.User.Id, Username = fixture.User.Username }];
      }
      var enlistment = new Mock<IEnlistmentNotification>();
      enlistment.Setup(item => item.Prepare(It.IsAny<PreparingEnlistment>()))
        .Callback((PreparingEnlistment item) => item.ForceRollback(new InvalidOperationException("Commit failed")));
      enlistment.Setup(item => item.Rollback(It.IsAny<Enlistment>())).Callback((Enlistment item) => item.Done());
      fixture.Repository.Setup(repository => repository.Update(It.IsAny<Organization>()))
        .Callback(() => Transaction.Current!.EnlistVolatile(enlistment.Object, EnlistmentOptions.None))
        .ReturnsAsync(fixture.Item);

      await Assert.ThrowsAsync<TransactionAbortedException>(() => remove
        ? fixture.Service.RemoveAdmins(fixture.Item.Id, [fixture.User.Username], true)
        : fixture.Service.AssignAdmins(fixture.Item.Id, [fixture.User.Username], true));

      enlistment.Verify(item => item.Prepare(It.IsAny<PreparingEnlistment>()), Times.Once);
      fixture.Identity.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task FailedRoleGrantPropagatesAndCanBeRetriedWithoutDuplicatingMembership()
    {
      var fixture = new Fixture();
      var synchronizationError = new InvalidOperationException("Identity provider unavailable");
      fixture.Identity.Setup(client => client.EnsureRoles(It.IsAny<Guid>(), It.IsAny<List<string>>()))
        .ThrowsAsync(synchronizationError);

      var result = await Assert.ThrowsAsync<InvalidOperationException>(() =>
        fixture.Service.AssignAdmins(fixture.Item.Id, [fixture.User.Username], true));

      Assert.Same(synchronizationError, result);
      Assert.Single(fixture.Members);
      fixture.Identity.Setup(client => client.EnsureRoles(It.IsAny<Guid>(), It.IsAny<List<string>>()))
        .Returns(Task.CompletedTask);
      await fixture.Service.AssignAdmins(fixture.Item.Id, [fixture.User.Username], true);

      Assert.Single(fixture.Members);
      fixture.Identity.Verify(client => client.EnsureRoles(fixture.User.ExternalId!.Value, It.IsAny<List<string>>()), Times.Exactly(2));
    }

    [Fact]
    public async Task FailedRoleRemovalPropagatesAndCanBeRetriedAfterMembershipWasRemoved()
    {
      var fixture = new Fixture();
      fixture.Members.Add(new OrganizationUser { OrganizationId = fixture.Item.Id, UserId = fixture.User.Id });
      fixture.Item.Administrators = [new UserInfo { Id = fixture.User.Id, Username = fixture.User.Username }];
      fixture.Identity.Setup(client => client.RemoveRoles(fixture.User.ExternalId!.Value, It.IsAny<List<string>>()))
        .ThrowsAsync(new InvalidOperationException("Identity provider unavailable"));

      await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Service.RemoveAdmins(fixture.Item.Id, [fixture.User.Username], true));

      Assert.Empty(fixture.Members);
      fixture.Identity.Setup(client => client.RemoveRoles(fixture.User.ExternalId!.Value, It.IsAny<List<string>>()))
        .Returns(Task.CompletedTask);
      await fixture.Service.RemoveAdmins(fixture.Item.Id, [fixture.User.Username], true);

      Assert.Empty(fixture.Members);
      fixture.Identity.Verify(client => client.RemoveRoles(fixture.User.ExternalId!.Value, It.IsAny<List<string>>()), Times.Exactly(2));
    }

    [Fact]
    public async Task ConcurrentRoleReconciliationCannotRestoreARemovedMembership()
    {
      var fixture = new Fixture();
      fixture.Members.Add(new OrganizationUser { OrganizationId = fixture.Item.Id, UserId = fixture.User.Id });
      fixture.Item.Administrators = [new UserInfo { Id = fixture.User.Id, Username = fixture.User.Username }];
      using var gate = new SemaphoreSlim(1);
      fixture.Locks.Setup(service => service.TryRunWithLockAsync($"organization_admin_roles:{fixture.User.Id}",
        It.IsAny<TimeSpan>(), It.IsAny<TimeSpan>(), It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>(), It.IsAny<string>()))
        .Returns(async (string _, TimeSpan _, TimeSpan _, Func<Task> action, CancellationToken _, string _) =>
        {
          await gate.WaitAsync(TestContext.Current.CancellationToken);
          try
          {
            await action();
          }
          finally
          {
            gate.Release();
          }
          return true;
        });
      var grantStarted = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      var finishGrant = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      var hasRole = false;
      fixture.Identity.Setup(client => client.EnsureRoles(fixture.User.ExternalId!.Value, It.IsAny<List<string>>()))
        .Returns(async () =>
        {
          grantStarted.SetResult();
          await finishGrant.Task;
          hasRole = true;
        });
      fixture.Identity.Setup(client => client.RemoveRoles(fixture.User.ExternalId!.Value, It.IsAny<List<string>>()))
        .Callback(() => hasRole = false).Returns(Task.CompletedTask);

      var granting = fixture.Service.AssignAdmins(fixture.Item.Id, [fixture.User.Username], true);
      await grantStarted.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
      var removing = fixture.Service.RemoveAdmins(fixture.Item.Id, [fixture.User.Username], true);
      try
      {
        // The newer removal must wait for the older external grant, then read current membership.
        fixture.Identity.Verify(client => client.RemoveRoles(It.IsAny<Guid>(), It.IsAny<List<string>>()), Times.Never);
      }
      finally
      {
        finishGrant.SetResult();
        await Task.WhenAll(granting, removing).WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
      }

      Assert.False(hasRole);
      fixture.Identity.Verify(client => client.RemoveRoles(fixture.User.ExternalId!.Value, It.IsAny<List<string>>()), Times.Once);
    }

    [Fact]
    public async Task BusyRoleReconciliationRemainsRetryableWithoutChangingRoles()
    {
      var fixture = new Fixture();
      fixture.Locks.Setup(service => service.TryRunWithLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(),
        It.IsAny<TimeSpan>(), It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>(), It.IsAny<string>())).ReturnsAsync(false);

      await Assert.ThrowsAsync<Domain.Core.Exceptions.RequestInProgressException>(() =>
        fixture.Service.AssignAdmins(fixture.Item.Id, [fixture.User.Username], true));

      Assert.Single(fixture.Members);
      fixture.Identity.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RemovingOneMembershipKeepsTheRoleWhenAnotherMembershipExists()
    {
      var fixture = new Fixture();
      fixture.Members.Add(new OrganizationUser { OrganizationId = fixture.Item.Id, UserId = fixture.User.Id });
      fixture.Members.Add(new OrganizationUser { OrganizationId = Guid.NewGuid(), UserId = fixture.User.Id });
      fixture.Item.Administrators = [new UserInfo { Id = fixture.User.Id, Username = fixture.User.Username }];

      await fixture.Service.RemoveAdmins(fixture.Item.Id, [fixture.User.Username], true);

      Assert.Single(fixture.Members);
      fixture.Identity.Verify(client => client.RemoveRoles(It.IsAny<Guid>(), It.IsAny<List<string>>()), Times.Never);
      fixture.Identity.Verify(client => client.EnsureRoles(fixture.User.ExternalId!.Value, It.IsAny<List<string>>()), Times.Once);
    }

    [Fact]
    public async Task RemovalRetryReconcilesRolesWhenMembershipIsAlreadyAbsent()
    {
      var fixture = new Fixture();

      await fixture.Service.RemoveAdmins(fixture.Item.Id, [fixture.User.Username], true);

      fixture.Identity.Verify(client => client.RemoveRoles(fixture.User.ExternalId!.Value, It.IsAny<List<string>>()), Times.Once);
    }

    [Fact]
    public async Task RewardPoolUpdatePreservesCurrentMembershipsAndMetadata()
    {
      var fixture = new Fixture();
      var admin = new UserInfo { Id = Guid.NewGuid(), Username = "current@example.invalid" };
      fixture.Item.Administrators = [admin];

      var result = await fixture.Service.UpdateRewardPool(fixture.Item.Id, new() { ZltoRewardPoolCurrentFinancialYear = 50 });

      Assert.Equal(50m, result.ZltoRewardPoolCurrentFinancialYear);
      Assert.Equal("Existing organization", result.Name);
      Assert.Same(admin, Assert.Single(result.Administrators!));
      fixture.Repository.Verify(repository => repository.Query(true, LockMode.Wait), Times.Once);
      fixture.MembersRepository.VerifyNoOtherCalls();
      fixture.Identity.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RewardPoolCannotBeReducedBelowCurrentAllocations()
    {
      var fixture = new Fixture();
      fixture.Item.ZltoRewardCumulativeCurrentFinancialYear = 20;

      await Assert.ThrowsAsync<FluentValidation.ValidationException>(() => fixture.Service.UpdateRewardPool(fixture.Item.Id,
        new() { ZltoRewardPoolCurrentFinancialYear = 19 }));

      fixture.Repository.Verify(repository => repository.Update(It.IsAny<Organization>()), Times.Never);
    }

    [Fact]
    public async Task OrganizationAdminCannotUpdateRewardPools()
    {
      var fixture = new Fixture();
      fixture.Accessor.HttpContext!.User = new ClaimsPrincipal(new ClaimsIdentity([
        new Claim(ClaimTypes.Role, Domain.Core.Constants.Role_OrganizationAdmin)], "test"));

      await Assert.ThrowsAsync<Domain.Core.Exceptions.SecurityException>(() => fixture.Service.UpdateRewardPool(fixture.Item.Id, new()));

      fixture.Repository.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    [InlineData(1.5)]
    [InlineData(10000001)]
    public async Task RewardPoolRetainsTheExistingValueLimits(double amount)
    {
      var fixture = new Fixture();

      await Assert.ThrowsAsync<FluentValidation.ValidationException>(() => fixture.Service.UpdateRewardPool(fixture.Item.Id,
        new() { ZltoRewardPoolCurrentFinancialYear = (decimal)amount }));

      fixture.Repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ClearingTheRewardPoolRemainsSupported()
    {
      var fixture = new Fixture();
      fixture.Item.ZltoRewardPoolCurrentFinancialYear = 50;

      var result = await fixture.Service.UpdateRewardPool(fixture.Item.Id, new());

      Assert.Null(result.ZltoRewardPoolCurrentFinancialYear);
      fixture.Identity.VerifyNoOtherCalls();
    }
    #endregion

    #region Fixture
    private sealed class Fixture
    {
      internal User User { get; } = new() { Id = Guid.NewGuid(), ExternalId = Guid.NewGuid(), Username = "admin@example.invalid" };
      internal Organization Item { get; } = new() { Id = Guid.NewGuid(), Name = "Existing organization", Status = OrganizationStatus.Active };
      internal List<OrganizationUser> Members { get; } = [];
      internal Guid CountryId { get; } = Guid.NewGuid();
      internal Guid ProviderTypeId { get; } = Guid.NewGuid();
      internal HttpContextAccessor Accessor { get; } = new()
      {
        HttpContext = new DefaultHttpContext
        {
          User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Role, Domain.Core.Constants.Role_Admin)], "test"))
        }
      };
      internal Mock<IRepositoryBatchedValueContainsWithNavigationAndTrackingTotals<Organization>> Repository { get; } = new();
      internal Mock<IRepository<OrganizationUser>> MembersRepository { get; } = new();
      internal Mock<IIdentityProviderClient> Identity { get; } = new();
      internal Mock<IDistributedLockService> Locks { get; } = new();
      internal Mock<IBlobService> Blobs { get; } = new();
      internal OrganizationService Service { get; }

      internal Fixture()
      {
        Locks.Setup(service => service.TryRunWithLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(),
          It.IsAny<TimeSpan>(), It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>(), It.IsAny<string>()))
          .Returns(async (string _, TimeSpan _, TimeSpan _, Func<Task> action, CancellationToken _, string _) =>
          {
            await action();
            return true;
          });
        Repository.Setup(repository => repository.Query()).Returns(() => new[] { Item }.AsQueryable());
        Repository.Setup(repository => repository.Query(It.IsAny<bool>())).Returns(() => new[] { Item }.AsQueryable());
        Repository.Setup(repository => repository.Query(It.IsAny<bool>(), It.IsAny<LockMode>())).Returns(() => new[] { Item }.AsQueryable());
        Repository.Setup(repository => repository.Create(It.IsAny<Organization>())).ReturnsAsync((Organization item) =>
        {
          item.Id = Guid.NewGuid();
          return item;
        });
        Repository.Setup(repository => repository.Update(It.IsAny<Organization>())).ReturnsAsync((Organization item) => item);
        MembersRepository.Setup(repository => repository.Query()).Returns(() => Members.AsQueryable());
        MembersRepository.Setup(repository => repository.Create(It.IsAny<OrganizationUser>())).ReturnsAsync((OrganizationUser member) =>
        {
          Members.Add(member);
          return member;
        });
        MembersRepository.Setup(repository => repository.Delete(It.IsAny<OrganizationUser>()))
          .Callback((OrganizationUser member) => Members.Remove(member)).Returns(Task.CompletedTask);
        var users = new Mock<IUserService>();
        users.Setup(service => service.GetCurrentUser(It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>())).Returns(User);
        users.Setup(service => service.GetByUsername(User.Username, false, false)).Returns(User);
        users.Setup(service => service.GetById(User.Id, false, false)).Returns(User);
        var identity = new Mock<IIdentityProviderClientFactory>();
        identity.Setup(factory => factory.CreateClient()).Returns(Identity.Object);
        var settings = new Mock<ISettingsDefinitionService>();
        settings.Setup(service => service.ListByEntityType(EntityType.Organization))
          .Returns([new SettingsDefinition { Key = "Test", Type = SettingType.Boolean, DefaultValue = "false" }]);
        var strategy = new Mock<IExecutionStrategyService>();
        strategy.Setup(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), It.IsAny<bool>()))
          .Returns((Func<Task> action, bool _) => action());
        var countries = new Mock<ICountryService>();
        countries.Setup(service => service.GetByIdOrNull(CountryId)).Returns(new Domain.Lookups.Models.Country { Id = CountryId });
        var providers = new Mock<IOrganizationProviderTypeService>();
        var provider = new Domain.Entity.Models.Lookups.OrganizationProviderType { Id = ProviderTypeId, Name = "Other" };
        providers.Setup(service => service.GetById(ProviderTypeId)).Returns(provider);
        providers.Setup(service => service.GetByIdOrNull(ProviderTypeId)).Returns(provider);
        var statuses = new Mock<IOrganizationStatusService>();
        statuses.Setup(service => service.GetByName(OrganizationStatus.Inactive.ToString()))
          .Returns(new Domain.Entity.Models.Lookups.OrganizationStatus { Id = Guid.NewGuid(), Name = OrganizationStatus.Inactive.ToString() });

        Service = new OrganizationService(NullLogger<OrganizationService>.Instance, Options.Create(new AppSettings
        {
          DistributedLockUserActionAcquireTimeoutInMilliseconds = 2000,
          DistributedLockUserActionLeaseDurationInSeconds = 120
        }), Accessor,
          users.Object, identity.Object, statuses.Object, providers.Object, Blobs.Object, Mock.Of<ISSITenantService>(),
          Mock.Of<INotificationURLFactory>(), Mock.Of<INotificationDeliveryService>(), settings.Object,
          new OrganizationRequestValidatorCreate(countries.Object, providers.Object), new OrganizationRequestValidatorUpdate(countries.Object, providers.Object),
          new OrganizationRequestUpdateRewardPoolValidator(), new OrganizationSearchFilterValidator(), new OrganizationRequestUpdateStatusValidator(),
          new SettingsRequestValidator(), Mock.Of<IMediator>(), Repository.Object, MembersRepository.Object,
          Mock.Of<IRepository<OrganizationProviderType>>(), Mock.Of<IRepository<OrganizationDocument>>(), strategy.Object, Locks.Object);
      }
    }
    #endregion
  }
}
