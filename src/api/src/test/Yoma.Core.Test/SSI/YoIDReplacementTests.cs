using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using System.Transactions;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Test.SSI
{
  public class YoIDReplacementTests
  {
    #region Tests
    [Fact]
    public async Task UserWithoutAnIssuanceScheduleDoesNotAbortTheProfileTransaction()
    {
      using var fixture = new Fixture();
      using var transaction = TransactionScopeHelper.CreateReadCommitted();

      await fixture.Service.ScheduleReissuance(Guid.NewGuid());

      Assert.Equal(TransactionStatus.Active, Transaction.Current!.TransactionInformation.Status);

      transaction.Complete();

      fixture.Provider.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ProfileRequestOnlyQueuesAndCoalescesWithoutProviderCalls()
    {
      using var fixture = new Fixture();

      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      await fixture.Service.ScheduleReissuance(fixture.User.Id);

      var item = Assert.Single(fixture.Rows.Values);

      Assert.Equal(CredentialIssuanceStatus.Reissue, item.Status);
      Assert.NotNull(item.DateRefreshRequested);
      fixture.Provider.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(CredentialIssuanceStatus.Pending, true)]
    [InlineData(CredentialIssuanceStatus.Issued, true)]
    [InlineData(CredentialIssuanceStatus.Reissue, true)]
    [InlineData(CredentialIssuanceStatus.Replay, true)]
    [InlineData(CredentialIssuanceStatus.Error, false)]
    [InlineData(CredentialIssuanceStatus.Revoke, false)]
    [InlineData(CredentialIssuanceStatus.Revoked, false)]
    [InlineData(CredentialIssuanceStatus.Deleted, false)]
    public async Task SchedulingHandlesEachIssuanceStatus(CredentialIssuanceStatus status, bool scheduled)
    {
      using var fixture = new Fixture();
      fixture.Rows[fixture.Original.Id].Status = status;

      await fixture.Service.ScheduleReissuance(fixture.User.Id);

      var item = Assert.Single(fixture.Rows.Values);

      Assert.Equal(status == CredentialIssuanceStatus.Issued ? CredentialIssuanceStatus.Reissue : status, item.Status);
      Assert.Equal(scheduled, item.DateRefreshRequested.HasValue);
      fixture.Provider.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SchedulingRejectsAnUnsupportedIssuanceStatus()
    {
      using var fixture = new Fixture();
      fixture.Rows[fixture.Original.Id].Status = (CredentialIssuanceStatus)int.MaxValue;

      await Assert.ThrowsAsync<NotSupportedException>(() => fixture.Service.ScheduleReissuance(fixture.User.Id));

      Assert.Null(fixture.Rows[fixture.Original.Id].DateRefreshRequested);
      fixture.Provider.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ProcessingRejectsAnUnsupportedPersistedStatus()
    {
      using var fixture = new Fixture();
      fixture.Rows[fixture.Original.Id].Status = (CredentialIssuanceStatus)int.MaxValue;

      await Assert.ThrowsAsync<NotSupportedException>(() => fixture.Service.ProcessReissuance(fixture.Original, true));

      Assert.Single(fixture.Rows.Values);
      fixture.Provider.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RetryRejectsAnUnsupportedPersistedStatus()
    {
      using var fixture = new Fixture();
      fixture.Rows[fixture.Original.Id].Status = (CredentialIssuanceStatus)int.MaxValue;

      var failure = new SSICredentialIssuance
      {
        Id = fixture.Original.Id,
        SchemaName = fixture.Original.SchemaName,
        Status = CredentialIssuanceStatus.Error,
        ErrorReason = "Provider request failed"
      };

      await Assert.ThrowsAsync<NotSupportedException>(() => fixture.Service.UpdateScheduleIssuance(failure));

      Assert.Equal((CredentialIssuanceStatus)int.MaxValue, fixture.Rows[fixture.Original.Id].Status);
      fixture.Provider.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PendingProfileChangeMovesToReissueOnlyAfterIssuance()
    {
      using var fixture = new Fixture();
      var pending = fixture.Rows[fixture.Original.Id];
      pending.Status = CredentialIssuanceStatus.Pending;

      await fixture.Service.ScheduleReissuance(fixture.User.Id);

      Assert.Equal(CredentialIssuanceStatus.Pending, fixture.Rows[pending.Id].Status);

      var issued = Fixture.Clone(fixture.Rows[pending.Id]);
      issued.Status = CredentialIssuanceStatus.Issued;
      await fixture.Service.UpdateScheduleIssuance(issued);

      Assert.Equal(CredentialIssuanceStatus.Reissue, fixture.Rows[pending.Id].Status);
      Assert.Equal(fixture.Original.CredentialId, fixture.Rows[pending.Id].CredentialId);
      Assert.NotNull(fixture.Rows[pending.Id].DateRefreshRequested);
    }

    [Fact]
    public async Task LateIssuanceAcknowledgementPreservesQueuedReissuance()
    {
      using var fixture = new Fixture();
      var acknowledgement = Fixture.Clone(fixture.Original);

      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      var requested = fixture.Rows[fixture.Original.Id].DateRefreshRequested;

      await fixture.Service.UpdateScheduleIssuance(acknowledgement);

      Assert.Equal(CredentialIssuanceStatus.Reissue, fixture.Rows[fixture.Original.Id].Status);
      Assert.Equal(requested, fixture.Rows[fixture.Original.Id].DateRefreshRequested);
      Assert.Single(fixture.Rows);
    }

    [Fact]
    public async Task ComparisonFailureRetriesAsReissueAndPreservesTheIssuedCredential()
    {
      using var fixture = new Fixture();
      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      var failure = Fixture.Clone(fixture.Rows[fixture.Original.Id]);
      failure.Status = CredentialIssuanceStatus.Error;
      failure.ErrorReason = "Credential lookup failed";

      await fixture.Service.UpdateScheduleIssuance(failure);

      var item = fixture.Rows[fixture.Original.Id];
      Assert.Equal(CredentialIssuanceStatus.Reissue, item.Status);
      Assert.Equal((byte)0, item.RetryCount);
      Assert.Equal(fixture.Original.CredentialId, item.CredentialId);
      Assert.Equal(fixture.Original.SchemaVersion, item.SchemaVersion);
      Assert.NotNull(item.DateRefreshRequested);
      Assert.Empty(fixture.Operations);
    }

    private static readonly string[] expected = ["revoke", "issue", "delete"];

    [Fact]
    public async Task ExhaustedComparisonKeepsTheExistingCredentialWithoutSchedulingAReplacement()
    {
      using var fixture = new Fixture(maxRetries: 0);
      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      var failure = Fixture.Clone(fixture.Rows[fixture.Original.Id]);
      failure.Status = CredentialIssuanceStatus.Error;
      failure.ErrorReason = "Credential lookup failed";

      await fixture.Service.UpdateScheduleIssuance(failure);

      Assert.Equal(CredentialIssuanceStatus.Error, fixture.Rows[fixture.Original.Id].Status);
      Assert.Single(fixture.Rows);
      Assert.Single(fixture.Credentials);
      Assert.Empty(fixture.Service.ListPendingReissuanceSchedule(10, []));
      Assert.Empty(fixture.Service.ListPendingIssuanceSchedule(10, []));
    }

    [Theory]
    [InlineData(CredentialIssuanceStatus.Revoke)]
    [InlineData(CredentialIssuanceStatus.Revoked)]
    [InlineData(CredentialIssuanceStatus.Deleted)]
    [InlineData(CredentialIssuanceStatus.Error)]
    [InlineData(CredentialIssuanceStatus.Replay)]
    public async Task LateIssuanceCannotOverwriteAnotherLifecycleState(CredentialIssuanceStatus status)
    {
      using var fixture = new Fixture();
      fixture.Rows[fixture.Original.Id].Status = status;

      await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Service.UpdateScheduleIssuance(Fixture.Clone(fixture.Original)));

      Assert.Equal(status, fixture.Rows[fixture.Original.Id].Status);
    }

    [Fact]
    public async Task LateFailureAfterCleanupCannotRestartTheCredential()
    {
      using var fixture = new Fixture();
      fixture.User.Surname = "Changed";
      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      await fixture.Background.ProcessCredentialIssuance();

      var failure = Fixture.Clone(fixture.Original);
      failure.Status = CredentialIssuanceStatus.Error;
      failure.ErrorReason = "Commit acknowledgement lost";
      await fixture.Service.UpdateScheduleIssuance(failure);

      Assert.Equal(CredentialIssuanceStatus.Deleted, fixture.Rows[fixture.Original.Id].Status);
      Assert.Null(fixture.Rows[fixture.Original.Id].ErrorReason);
      Assert.Equal(2, fixture.Rows.Count);
      Assert.Single(fixture.Credentials);
    }

    [Fact]
    public async Task ChangedSignedValueRevokesReplacesThenDeletesWithNewDateAndLatestSchema()
    {
      using var fixture = new Fixture();
      fixture.User.Surname = "Changed";

      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      await fixture.Background.ProcessCredentialIssuance();

      var old = fixture.Rows[fixture.Original.Id];
      var replacement = Assert.Single(fixture.Rows.Values, item => item.ParentId == old.Id);

      Assert.Equal(CredentialIssuanceStatus.Deleted, old.Status);
      Assert.NotNull(old.DateRevoked);
      Assert.NotNull(old.DateDeleted);
      Assert.Equal(fixture.Original.DateIssued, old.DateIssued);
      Assert.Equal(fixture.Original.CredentialId, old.CredentialId);
      Assert.Equal("1.0", old.SchemaVersion);
      Assert.Equal(CredentialIssuanceStatus.Issued, replacement.Status);
      Assert.Equal("1.1", replacement.SchemaVersion);
      Assert.True(replacement.DateIssued > old.DateIssued);
      Assert.NotEqual(old.CredentialId, replacement.CredentialId);
      Assert.Equal(expected, fixture.Operations);

      var credential = Assert.Single(fixture.Credentials.Values);

      Assert.Equal(replacement.Id.ToString(), credential.Attributes[SSISchemaService.SchemaAttribute_Internal_ReferentClient]);
      Assert.Equal("Changed", credential.Attributes["User_Surname"]);
      Assert.Equal("Country", credential.Attributes["User_Country"]);
    }

    [Theory]
    [InlineData("Original", "Changed country")]
    [InlineData(" Original ", "Country")]
    public async Task UnchangedSignedValuesAndLatestOnlyFieldsDoNotReplace(string surname, string country)
    {
      using var fixture = new Fixture();
      fixture.User.Surname = surname;
      fixture.User.Country = country;

      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      await fixture.Background.ProcessCredentialIssuance();

      Assert.Single(fixture.Rows);
      Assert.Empty(fixture.Operations);
      Assert.Null(fixture.Rows[fixture.Original.Id].DateRefreshRequested);
      Assert.Equal(CredentialIssuanceStatus.Issued, fixture.Rows[fixture.Original.Id].Status);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task AddingOrRemovingAnOptionalSignedValueReplacesTheCredential(bool remove)
    {
      using var fixture = new Fixture();
      if (remove) fixture.User.Surname = null;
      else fixture.Credentials[fixture.Original.CredentialId!].Attributes.Remove("User_Surname");

      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      await fixture.Background.ProcessCredentialIssuance();

      var replacement = Assert.Single(fixture.Rows.Values, item => item.ParentId == fixture.Original.Id);
      var credential = Assert.Single(fixture.Credentials.Values);

      Assert.Equal(CredentialIssuanceStatus.Deleted, fixture.Rows[fixture.Original.Id].Status);
      Assert.Equal(CredentialIssuanceStatus.Issued, replacement.Status);
      Assert.Equal(!remove, credential.Attributes.ContainsKey("User_Surname"));
      Assert.Equal(expected, fixture.Operations);
    }

    [Fact]
    public async Task UnsupportedProviderKeepsTheExistingCredential()
    {
      using var fixture = new Fixture();
      fixture.Provider.Setup(provider => provider.SupportsCredentialRevocation(It.IsAny<ArtifactType>())).Returns(false);
      fixture.User.Surname = "Changed";

      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      await fixture.Background.ProcessCredentialIssuance();

      Assert.Single(fixture.Rows);
      Assert.Equal(CredentialIssuanceStatus.Issued, fixture.Rows[fixture.Original.Id].Status);
      Assert.Empty(fixture.Operations);
    }

    [Fact]
    public async Task NewProfileRequestCannotBeClearedByAnOlderComparison()
    {
      using var fixture = new Fixture();

      await fixture.Service.ScheduleReissuance(fixture.User.Id);

      var snapshot = Fixture.Clone(fixture.Rows[fixture.Original.Id]);
      fixture.Rows[fixture.Original.Id].DateRefreshRequested = snapshot.DateRefreshRequested!.Value.AddSeconds(1);

      await fixture.Service.ProcessReissuance(snapshot, true);

      Assert.Single(fixture.Rows);
      Assert.NotEqual(snapshot.DateRefreshRequested, fixture.Rows[fixture.Original.Id].DateRefreshRequested);
      Assert.Equal(CredentialIssuanceStatus.Reissue, fixture.Rows[fixture.Original.Id].Status);
    }

    [Fact]
    public async Task RepeatedRefreshCompletionCannotScheduleTwoChildren()
    {
      using var fixture = new Fixture();

      await fixture.Service.ScheduleReissuance(fixture.User.Id);

      var snapshot = Fixture.Clone(fixture.Rows[fixture.Original.Id]);

      await fixture.Service.ProcessReissuance(snapshot, true);
      await fixture.Service.ProcessReissuance(snapshot, true);

      Assert.Equal(2, fixture.Rows.Count);
      Assert.Empty(fixture.Service.ListPendingIssuanceSchedule(10, []));
    }

    [Fact]
    public async Task RevocationFailureUsesCommonRetriesAndNeverReleasesReplacement()
    {
      using var fixture = new Fixture();
      fixture.User.Surname = "Changed";
      fixture.RevokeFails = true;

      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Revoke, fixture.Rows[fixture.Original.Id].Status);
      Assert.Equal((byte)0, fixture.Rows[fixture.Original.Id].RetryCount);
      Assert.Null(fixture.Rows[fixture.Original.Id].DateRevoked);
      Assert.Single(fixture.Credentials);
      Assert.DoesNotContain("issue", fixture.Operations);

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal((byte)1, fixture.Rows[fixture.Original.Id].RetryCount);

      fixture.RevokeFails = false;

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Deleted, fixture.Rows[fixture.Original.Id].Status);
    }

    [Fact]
    public async Task ExhaustedRevocationKeepsChildPendingAndExistingCredential()
    {
      using var fixture = new Fixture(maxRetries: 0);
      fixture.User.Surname = "Changed";
      fixture.RevokeFails = true;

      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Error, fixture.Rows[fixture.Original.Id].Status);
      Assert.Null(fixture.Rows[fixture.Original.Id].DateRevoked);
      Assert.Empty(fixture.Service.ListPendingIssuanceSchedule(10, []));
      Assert.Single(fixture.Credentials);
    }

    [Fact]
    public async Task FailedReplacementRetainsRevokedCopyUntilDeliverySucceeds()
    {
      using var fixture = new Fixture();
      fixture.User.Surname = "Changed";
      fixture.IssueFails = true;

      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Revoked, fixture.Rows[fixture.Original.Id].Status);
      Assert.DoesNotContain("delete", fixture.Operations);

      fixture.IssueFails = false;

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Deleted, fixture.Rows[fixture.Original.Id].Status);
      Assert.Equal(1, fixture.Operations.Count(operation => operation == "revoke"));
    }

    [Fact]
    public async Task FailedCleanupDoesNotReissueOrRevokeReplacement()
    {
      using var fixture = new Fixture();
      fixture.User.Surname = "Changed";
      fixture.DeleteFails = true;

      await fixture.Service.ScheduleReissuance(fixture.User.Id);
      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Revoked, fixture.Rows[fixture.Original.Id].Status);
      Assert.Equal((byte)0, fixture.Rows[fixture.Original.Id].RetryCount);
      Assert.NotNull(fixture.Rows[fixture.Original.Id].DateRevoked);
      Assert.Equal(2, fixture.Credentials.Count);

      fixture.DeleteFails = false;

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Deleted, fixture.Rows[fixture.Original.Id].Status);
      Assert.Equal(1, fixture.Operations.Count(operation => operation == "issue"));
      Assert.Equal(1, fixture.Operations.Count(operation => operation == "revoke"));
    }

    [Fact]
    public async Task ProfileChangeDuringDeliveryIsCheckedAgainAfterIssuance()
    {
      using var fixture = new Fixture();
      fixture.User.Surname = "First change";

      await fixture.Service.ScheduleReissuance(fixture.User.Id);

      fixture.DuringIssue = async () =>
      {
        fixture.DuringIssue = null;
        fixture.User.Surname = "Second change";
        await fixture.Service.ScheduleReissuance(fixture.User.Id);
      };

      await fixture.Background.ProcessCredentialIssuance();

      var current = Assert.Single(fixture.Rows.Values, item => item.Status == CredentialIssuanceStatus.Issued);

      Assert.Equal("Second change", fixture.Credentials[current.CredentialId!].Attributes["User_Surname"]);
      Assert.Equal(3, fixture.Rows.Count);
      Assert.Equal(2, fixture.Rows.Values.Count(item => item.Status == CredentialIssuanceStatus.Deleted));
    }
    #endregion

    #region Fixture
    private sealed class Fixture : IDisposable
    {
      internal Dictionary<Guid, SSICredentialIssuance> Rows { get; } = [];
      internal Dictionary<string, Credential> Credentials { get; } = [];
      internal List<string> Operations { get; } = [];
      internal Mock<ISSIProviderClient> Provider { get; } = new();

      internal User User { get; } = new()
      {
        Id = Guid.NewGuid(),
        Username = "youth",
        Surname = "Original",
        Country = "Country"
      };

      internal SSICredentialIssuance Original { get; }

      internal SSICredentialService Service { get; }

      internal SSIBackgroundService Background { get; }

      internal bool RevokeFails { get; set; }

      internal bool IssueFails { get; set; }

      internal bool DeleteFails { get; set; }

      internal Func<Task>? DuringIssue { get; set; }

      private readonly ServiceProvider _services;

      internal Fixture(int maxRetries = -1)
      {
        var statusIds = Enum.GetValues<CredentialIssuanceStatus>().ToDictionary(value => value, _ => Guid.NewGuid());
        var typeIds = Enum.GetValues<SchemaType>().ToDictionary(value => value, _ => Guid.NewGuid());

        var settings = new AppSettings
        {
          SSIEnabledEnvironments = "Local",
          SSIMaximumRetryAttempts = maxRetries,
          SSIParallelism = new() { CredentialIssuance = 1 },
          YomaOrganizationName = "Yoma",
          SSISchemaFullNameYoID = "YoID|Default"
        };

        Original = new SSICredentialIssuance
        {
          Id = Guid.NewGuid(),
          UserId = User.Id,
          SchemaType = SchemaType.YoID,
          SchemaTypeId = typeIds[SchemaType.YoID],
          ArtifactType = ArtifactType.SDJWT,
          SchemaName = "YoID|Default",
          SchemaVersion = "1.0",
          Status = CredentialIssuanceStatus.Issued,
          StatusId = statusIds[CredentialIssuanceStatus.Issued],
          CredentialId = "old-wallet",
          DateIssued = DateTimeOffset.UtcNow.AddYears(-1)
        };

        Rows[Original.Id] = Clone(Original);

        Credentials[Original.CredentialId] = new Credential
        {
          Id = Original.CredentialId,
          SchemaId = "old-schema",
          Attributes = new Dictionary<string, string>()
          {
            ["User_Surname"] = "Original",
            [SSISchemaService.SchemaAttribute_Internal_ReferentClient] = Original.Id.ToString(),
            [SSISchemaService.SchemaAttribute_Internal_DateIssued] = Original.DateIssued.Value.ToString("O")
          }
        };

        var schemas = new Mock<ISSISchemaService>();

        static SSISchema Schema(bool latest) => new()
        {
          Id = latest ? "new-schema" : "old-schema",
          Name = "YoID|Default",
          Type = SchemaType.YoID,
          ArtifactType = ArtifactType.SDJWT,
          Version = latest ? new Version(1, 1) : new Version(1, 0),
          Entities =
          [
            new SSISchemaEntity
            {
              Name = nameof(User),
              TypeName = typeof(User).AssemblyQualifiedName!,
              Properties = latest ? [Property(nameof(User.Surname)), Property(nameof(User.Country))] : [Property(nameof(User.Surname))]
            }
          ]
        };

        schemas.Setup(value => value.GetById(It.IsAny<string>())).ReturnsAsync((string id) => Schema(id == "new-schema"));
        schemas.Setup(value => value.GetByFullName("YoID|Default")).ReturnsAsync(() => Schema(true));

        var statuses = new Mock<ISSICredentialIssuanceStatusService>();
        statuses.Setup(value => value.GetByName(It.IsAny<string>())).Returns((string name) => new SSICredentialIssuanceStatus { Id = statusIds[Enum.Parse<CredentialIssuanceStatus>(name)] });

        var types = new Mock<ISSISchemaTypeService>();
        types.Setup(value => value.GetByName(It.IsAny<string>())).Returns((string name) => new SSISchemaType { Id = typeIds[Enum.Parse<SchemaType>(name)] });

        var repository = new Mock<IRepository<SSICredentialIssuance>>();
        repository.Setup(value => value.Query()).Returns(() => Rows.Values.Select(Clone).AsQueryable());
        repository.Setup(value => value.Query(LockMode.Wait)).Returns(() => Rows.Values.Select(Clone).AsQueryable());
        repository.Setup(value => value.Update(It.IsAny<SSICredentialIssuance>())).ReturnsAsync((SSICredentialIssuance item) =>
        {
          Rows[item.Id] = Clone(item);
          return item;
        });

        repository.Setup(value => value.Create(It.IsAny<SSICredentialIssuance>())).ReturnsAsync((SSICredentialIssuance item) =>
        {
          item.Id = Guid.NewGuid();
          Rows.Add(item.Id, Clone(item));
          return item;
        });

        var tenantStatuses = new Mock<ISSITenantCreationStatusService>();
        tenantStatuses.Setup(value => value.GetByName(It.IsAny<string>())).Returns(new SSITenantCreationStatus { Id = Guid.NewGuid() });

        var tenantRepository = new Mock<IRepository<SSITenantCreation>>();
        tenantRepository.Setup(value => value.Query()).Returns(Array.Empty<SSITenantCreation>().AsQueryable());

        var participations = new Mock<IRepositoryBatchedWithNavigationAndCustomFieldFilter<Domain.MyOpportunity.Models.MyOpportunity>>();
        participations.Setup(value => value.Query()).Returns(Array.Empty<Domain.MyOpportunity.Models.MyOpportunity>().AsQueryable());

        Service = new SSICredentialService(Options.Create(settings), schemas.Object, statuses.Object, repository.Object, types.Object,
          tenantStatuses.Object, tenantRepository.Object, participations.Object, CredentialTestHelper.ExecutionStrategy());

        var tenants = new Mock<ISSITenantService>();
        tenants.Setup(value => value.GetTenantId(EntityType.User, User.Id)).Returns("holder");
        tenants.Setup(value => value.GetTenantIdOrNull(It.IsAny<EntityType>(), It.IsAny<Guid>())).Returns("holder");

        var users = new Mock<IUserService>();
        users.Setup(value => value.GetById(User.Id, true, true)).Returns(() => User);

        var organizations = new Mock<IOrganizationService>();
        organizations.Setup(value => value.GetByNameOrNull("Yoma", true, true)).Returns(new Organization { Id = Guid.NewGuid() });

        Provider.Setup(value => value.SupportsCredentialRevocation(ArtifactType.SDJWT)).Returns(true);

        Provider.Setup(value => value.GetCredentialByIdOrNull("holder", ArtifactType.SDJWT, It.IsAny<string>()))
          .ReturnsAsync((string _, ArtifactType _, string id) => Credentials.GetValueOrDefault(id));

        Provider.Setup(value => value.RevokeCredential("holder", ArtifactType.SDJWT, It.IsAny<string>(), It.IsAny<KeyValuePair<string, string>>()))
          .Returns((string _, ArtifactType _, string id, KeyValuePair<string, string> referent) =>
          {
            Assert.Null(System.Transactions.Transaction.Current);
            Assert.Equal(Credentials[id].Attributes[referent.Key], referent.Value);
            Operations.Add("revoke");

            if (RevokeFails) throw new InvalidOperationException("revocation failed");

            return Task.CompletedTask;
          });

        Provider.Setup(value => value.IssueCredential(It.IsAny<CredentialIssuanceRequest>())).Returns(async (CredentialIssuanceRequest request) =>
        {
          Assert.Null(System.Transactions.Transaction.Current);
          Operations.Add("issue");

          if (IssueFails) throw new InvalidOperationException("issuance failed");

          if (DuringIssue != null) await DuringIssue();

          var credential = new Credential
          {
            Id = Guid.NewGuid().ToString(),
            SchemaId = request.SchemaId,
            Attributes = request.Attributes
          };

          Credentials.Add(credential.Id, credential);
          return credential;
        });

        Provider.Setup(value => value.DeleteCredential("holder", ArtifactType.SDJWT, It.IsAny<string>())).Returns((string _, ArtifactType _, string id) =>
        {
          Assert.Null(System.Transactions.Transaction.Current);
          Operations.Add("delete");

          if (DeleteFails) throw new InvalidOperationException("delete failed");

          Credentials.Remove(id);

          return Task.CompletedTask;
        });

        var factory = new Mock<ISSIProviderClientFactory>();
        factory.Setup(value => value.CreateClient()).Returns(Provider.Object);

        _services = new ServiceCollection()
          .AddSingleton<ISSICredentialService>(Service)
          .AddSingleton(schemas.Object)
          .AddSingleton(tenants.Object)
          .AddSingleton(users.Object).AddSingleton(organizations.Object)
          .AddSingleton(Mock.Of<IMyOpportunityService>())
          .AddSingleton(Mock.Of<IOpportunityService>())
          .AddSingleton(Mock.Of<ICustomFieldDefinitionService>())
          .AddSingleton(Mock.Of<ICustomFieldValueService>())
          .AddSingleton(factory.Object)
          .BuildServiceProvider();

        var environment = new Mock<IEnvironmentProvider>();
        environment.SetupGet(value => value.Environment).Returns(Domain.Core.Environment.Local);

        var locks = new Mock<IDistributedLockService>();
        locks.Setup(value => value.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>())).ReturnsAsync(true);

        Background = new SSIBackgroundService(Mock.Of<ILogger<SSIBackgroundService>>(), Options.Create(settings), environment.Object,
          Options.Create(new ScheduleJobOptions { SSICredentialIssuanceScheduleBatchSize = 10, SSICredentialIssuanceScheduleMaxIntervalInHours = 1 }),
          _services.GetRequiredService<IServiceScopeFactory>(), schemas.Object, Mock.Of<ISSISchemaEntityService>(), tenants.Object,
          Service, locks.Object, Mock.Of<IHostApplicationLifetime>(), factory.Object);
      }

      internal static SSICredentialIssuance Clone(SSICredentialIssuance item) => JsonConvert.DeserializeObject<SSICredentialIssuance>(JsonConvert.SerializeObject(item))!;

      private static SSISchemaEntityProperty Property(string name) => new()
      {
        Name = name,
        AttributeName = "User_" + name
      };

      public void Dispose() => _services.Dispose();
    }
    #endregion
  }
}

