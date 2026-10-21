using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using System.Collections.Concurrent;
using Xunit;
using Yoma.Core.Domain.Core.Exceptions;
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
  public class CredentialReplayTests
  {
    #region Tests
    [Theory]
    [InlineData(1)]
    [InlineData(3)]
    public async Task AllReplayBatchesFinishCleanupBeforeAnyIssuanceStarts(int parallelism)
    {
      using var fixture = new Fixture(SchemaType.Opportunity, parallelism: parallelism);
      for (var index = 0; index < 24; index++) fixture.AddReplay();
      fixture.BeforeIssue = () => Assert.DoesNotContain(fixture.Items, item => item.Status == CredentialIssuanceStatus.Replay);

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(25, fixture.Requests.Count);
      Assert.All(fixture.Items, item =>
      {
        Assert.Equal(CredentialIssuanceStatus.Issued, item.Status);
        Assert.Equal(fixture.OriginalDate, item.DateIssued);
      });
      Assert.All(fixture.Credentials.Values, credential => Assert.Equal("new-schema", credential.SchemaId));
      fixture.Provider.Verify(client => client.DeleteCredential("holder", ArtifactType.JWS, It.IsAny<string>()), Times.Exactly(25));
    }

    [Fact]
    public async Task MissingHolderKeepsReplayAndDoesNotDeleteOrIssue()
    {
      using var fixture = new Fixture(SchemaType.YoID);
      fixture.Tenants.Setup(service => service.GetTenantId(EntityType.User, It.IsAny<Guid>()))
        .Throws(new EntityNotFoundException("Holder is not ready"));

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Replay, fixture.Item.Status);
      Assert.Equal("Holder is not ready", fixture.Item.ErrorReason);
      Assert.Single(fixture.Credentials);
      Assert.Empty(fixture.Requests);
      fixture.Provider.Verify(client => client.DeleteCredential(It.IsAny<string>(), It.IsAny<ArtifactType>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task DelayedDeletionConfirmationKeepsReplayRatherThanIssuingAnotherCredential()
    {
      using var fixture = new Fixture(SchemaType.YoID);
      fixture.Provider.Setup(client => client.DeleteCredential("holder", ArtifactType.ACR, It.IsAny<string>()))
        .Returns(Task.CompletedTask);

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Replay, fixture.Item.Status);
      Assert.Contains("still present", fixture.Item.ErrorReason);
      Assert.Single(fixture.Credentials);
      Assert.Empty(fixture.Requests);
    }

    [Fact]
    public async Task ProviderReadFailureIsNotMistakenForAbsence()
    {
      using var fixture = new Fixture(SchemaType.YoID);
      fixture.Provider.Setup(client => client.GetCredentialByIdOrNull("holder", ArtifactType.ACR, It.IsAny<string>()))
        .ThrowsAsync(new InvalidOperationException("Authentication failed"));

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Replay, fixture.Item.Status);
      Assert.Equal("Authentication failed", fixture.Item.ErrorReason);
      Assert.Single(fixture.Credentials);
      Assert.Empty(fixture.Requests);
      fixture.Provider.Verify(client => client.DeleteCredential(It.IsAny<string>(), It.IsAny<ArtifactType>(), It.IsAny<string>()), Times.Never);
    }

    [Theory]
    [InlineData(SchemaType.YoID)]
    [InlineData(SchemaType.Opportunity)]
    public async Task ReplayCleansFirstPreservesTheSignedDateAndReissuesOnce(SchemaType type)
    {
      using var fixture = new Fixture(type);
      var originalDate = fixture.OriginalDate;
      var originalId = fixture.Item.CredentialId;
      fixture.BeforeDelete = () =>
      {
        Assert.Equal(CredentialIssuanceStatus.Replay, fixture.Item.Status);
        Assert.Equal(originalId, fixture.Item.CredentialId);
        Assert.Equal("1.0", fixture.Item.SchemaVersion);
        Assert.Equal(originalDate, fixture.Item.DateIssued);
        Assert.Empty(fixture.Requests);
      };
      fixture.BeforeIssue = () =>
      {
        Assert.Equal(CredentialIssuanceStatus.Pending, fixture.Item.Status);
        Assert.Null(fixture.Item.CredentialId);
        Assert.Null(fixture.Item.SchemaVersion);
        Assert.Equal(originalDate, fixture.Item.DateIssued);
      };

      await fixture.Background.ProcessCredentialIssuance();
      await fixture.Background.ProcessCredentialIssuance();

      var request = Assert.Single(fixture.Requests);
      Assert.Equal(originalDate, DateTimeOffset.Parse(request.Attributes[SSISchemaService.SchemaAttribute_Internal_DateIssued]));
      Assert.Equal(fixture.Item.Id.ToString(), request.ClientReferent.Value);
      Assert.Equal("1.1", fixture.Item.SchemaVersion);
      Assert.Equal(CredentialIssuanceStatus.Issued, fixture.Item.Status);
      Assert.Equal(originalDate, fixture.Item.DateIssued);
      Assert.NotEqual(originalId, fixture.Item.CredentialId);
      Assert.Single(fixture.Credentials);
      fixture.Provider.Verify(client => client.DeleteCredential("holder", fixture.Item.ArtifactType, originalId!), Times.Once);
      fixture.Tenants.Verify(service => service.ScheduleCreation(It.IsAny<EntityType>(), It.IsAny<Guid>()), Times.Never);
      fixture.Tenants.Verify(service => service.UpdateScheduleCreation(It.IsAny<SSITenantCreation>()), Times.Never);
    }

    [Fact]
    public async Task SeededLegacyDateTakesPrecedenceOverTheOldCredentialDate()
    {
      using var fixture = new Fixture(SchemaType.YoID);
      var seeded = fixture.OriginalDate.AddDays(2);
      fixture.Item.DateIssued = seeded;

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(seeded, fixture.Item.DateIssued);
      Assert.Equal(seeded, DateTimeOffset.Parse(Assert.Single(fixture.Requests).Attributes[SSISchemaService.SchemaAttribute_Internal_DateIssued]));
    }

    [Fact]
    public async Task CleanupFailureKeepsIdentityAndReplayAndBlocksAllPendingIssuance()
    {
      using var fixture = new Fixture(SchemaType.Opportunity);
      fixture.AddPending();
      var oldId = fixture.Item.CredentialId;
      fixture.Provider.Setup(client => client.DeleteCredential("holder", fixture.Item.ArtifactType, oldId!))
        .ThrowsAsync(new InvalidOperationException("Provider unavailable"));

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Replay, fixture.Item.Status);
      Assert.Equal(oldId, fixture.Item.CredentialId);
      Assert.Equal(fixture.OriginalDate, fixture.Item.DateIssued);
      Assert.Equal("Provider unavailable", fixture.Item.ErrorReason);
      Assert.Empty(fixture.Requests);
      fixture.Lock.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Theory]
    [InlineData(SchemaType.YoID)]
    [InlineData(SchemaType.Opportunity)]
    public async Task ProviderDeleteLocalSaveFailureResumesWithoutDeletingAReplacement(SchemaType type)
    {
      using var fixture = new Fixture(type);
      var oldId = fixture.Item.CredentialId;
      var failed = false;
      fixture.BeforeSave = item =>
      {
        if (item.Status != CredentialIssuanceStatus.Pending || failed) return;
        failed = true;
        throw new InvalidOperationException("Local save failed");
      };

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Empty(fixture.Credentials);
      Assert.Empty(fixture.Requests);
      Assert.Equal(CredentialIssuanceStatus.Replay, fixture.Item.Status);
      Assert.Equal(oldId, fixture.Item.CredentialId);
      Assert.Equal(fixture.OriginalDate, fixture.Item.DateIssued);

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Issued, fixture.Item.Status);
      Assert.Equal(fixture.OriginalDate, fixture.Item.DateIssued);
      Assert.Single(fixture.Requests);
      fixture.Provider.Verify(client => client.DeleteCredential("holder", fixture.Item.ArtifactType, oldId!), Times.Once);
    }

    [Fact]
    public async Task DateCheckpointFailureDoesNotDeleteTheCredential()
    {
      using var fixture = new Fixture(SchemaType.YoID);
      fixture.BeforeSave = item =>
      {
        if (item.ErrorReason == null) throw new InvalidOperationException("Checkpoint failed");
      };

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Replay, fixture.Item.Status);
      Assert.Single(fixture.Credentials);
      Assert.Empty(fixture.Requests);
      fixture.Provider.Verify(client => client.DeleteCredential(It.IsAny<string>(), It.IsAny<ArtifactType>(), It.IsAny<string>()), Times.Never);
    }

    [Theory]
    [InlineData("referent")]
    [InlineData("schema")]
    [InlineData("artifact")]
    [InlineData("identity")]
    public async Task MismatchedArtifactsAreNeverDeleted(string mismatch)
    {
      using var fixture = new Fixture(SchemaType.YoID);
      var credential = Assert.Single(fixture.Credentials).Value;
      switch (mismatch)
      {
        case "referent": credential.Attributes[SSISchemaService.SchemaAttribute_Internal_ReferentClient] = Guid.NewGuid().ToString(); break;
        case "schema": fixture.ProviderSchema.Name = "YoID|Other"; break;
        case "artifact": fixture.ProviderSchema.ArtifactType = ArtifactType.JWS; break;
        case "identity": fixture.Item.CredentialId = "different-id"; break;
        default: throw new NotSupportedException($"Mismatch '{mismatch}' is not supported");
      }

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Replay, fixture.Item.Status);
      Assert.NotNull(fixture.Item.ErrorReason);
      Assert.Empty(fixture.Requests);
      fixture.Provider.Verify(client => client.DeleteCredential(It.IsAny<string>(), It.IsAny<ArtifactType>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task MissingRecordedIdentityRecoversByReferentAndCheckpointsBeforeDeletion()
    {
      using var fixture = new Fixture(SchemaType.YoID);
      var oldId = fixture.Item.CredentialId;
      fixture.Item.CredentialId = null;
      fixture.BeforeDelete = () => Assert.Equal(oldId, fixture.Item.CredentialId);

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Issued, fixture.Item.Status);
      Assert.Equal(fixture.OriginalDate, fixture.Item.DateIssued);
      fixture.Provider.Verify(client => client.DeleteCredential("holder", ArtifactType.ACR, oldId!), Times.Once);
    }

    [Fact]
    public async Task ConfirmedAbsenceWithoutAnOriginalDateUsesNowNotAuditTimestamps()
    {
      using var fixture = new Fixture(SchemaType.YoID);
      fixture.Credentials.Clear();
      fixture.Item.DateModified = fixture.OriginalDate;
      var before = DateTimeOffset.UtcNow;

      await fixture.Background.ProcessCredentialIssuance();

      Assert.NotNull(fixture.Item.DateIssued);
      Assert.InRange(fixture.Item.DateIssued.Value, before, DateTimeOffset.UtcNow);
      Assert.Single(fixture.Requests);
      fixture.Provider.Verify(client => client.DeleteCredential(It.IsAny<string>(), It.IsAny<ArtifactType>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task ShutdownDuringDeletionPersistsCleanupBeforeReleasingTheLock()
    {
      using var stopping = new CancellationTokenSource();
      using var fixture = new Fixture(SchemaType.YoID, stopping: stopping.Token);
      fixture.BeforeDelete = stopping.Cancel;

      await Assert.ThrowsAnyAsync<OperationCanceledException>(() => fixture.Background.ProcessCredentialIssuance());

      Assert.Empty(fixture.Credentials);
      Assert.Empty(fixture.Requests);
      Assert.Equal(CredentialIssuanceStatus.Pending, fixture.Item.Status);
      Assert.Null(fixture.Item.CredentialId);
      Assert.Equal(fixture.OriginalDate, fixture.Item.DateIssued);
      fixture.Lock.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }
    #endregion Tests

    #region Fixture
    private sealed class Fixture : IDisposable
    {
      #region Class Variables
      private readonly ServiceProvider _services;
      private readonly ConcurrentDictionary<Guid, SSICredentialIssuance> _items = new();
      private readonly List<Domain.MyOpportunity.Models.MyOpportunity> _participations = [];
      private readonly Dictionary<CredentialIssuanceStatus, Guid> _statusIds = Enum.GetValues<CredentialIssuanceStatus>().ToDictionary(status => status, _ => Guid.NewGuid());
      private readonly Guid _id = Guid.NewGuid();

      public SSICredentialIssuance Item => _items[_id];
      public IEnumerable<SSICredentialIssuance> Items => _items.Values;
      public ConcurrentDictionary<string, Credential> Credentials { get; } = new();
      public List<CredentialIssuanceRequest> Requests { get; } = [];
      public Mock<ISSIProviderClient> Provider { get; } = new(MockBehavior.Strict);
      public Mock<ISSITenantService> Tenants { get; } = new();
      public Mock<IDistributedLockService> Lock { get; } = new();
      public DateTimeOffset OriginalDate { get; } = new(2025, 7, 15, 12, 30, 0, TimeSpan.Zero);
      public Domain.SSI.Models.Provider.Schema ProviderSchema { get; }
      public Action? BeforeDelete { get; set; }
      public Action? BeforeIssue { get; set; }
      public Action<SSICredentialIssuance>? BeforeSave { get; set; }
      public SSIBackgroundService Background { get; }
      #endregion Class Variables

      #region Constructor
      public Fixture(SchemaType type, int parallelism = 1, CancellationToken stopping = default)
      {
        var participation = new Domain.MyOpportunity.Models.MyOpportunity
        {
          Id = Guid.NewGuid(),
          UserId = Guid.NewGuid(),
          OrganizationId = Guid.NewGuid(),
          OpportunityId = Guid.NewGuid()
        };
        var typeId = Guid.NewGuid();
        _participations.Add(participation);
        _items[_id] = new SSICredentialIssuance
        {
          Id = _id,
          SchemaType = type,
          SchemaTypeId = typeId,
          ArtifactType = type == SchemaType.YoID ? ArtifactType.ACR : ArtifactType.JWS,
          SchemaName = type == SchemaType.YoID ? "YoID|Default" : "Opportunity|Default",
          SchemaVersion = "1.0",
          Status = CredentialIssuanceStatus.Replay,
          StatusId = _statusIds[CredentialIssuanceStatus.Replay],
          UserId = type == SchemaType.YoID ? participation.UserId : null,
          MyOpportunityId = type == SchemaType.Opportunity ? participation.Id : null,
          CredentialId = Guid.NewGuid().ToString()
        };
        ProviderSchema = new Domain.SSI.Models.Provider.Schema
        {
          Id = "old-schema",
          Name = Item.SchemaName,
          ArtifactType = Item.ArtifactType,
          Version = new Version(1, 0)
        };
        Credentials[Item.CredentialId!] = new Credential
        {
          Id = Item.CredentialId!,
          SchemaId = ProviderSchema.Id,
          Attributes = new Dictionary<string, string>
          {
            [SSISchemaService.SchemaAttribute_Internal_ReferentClient] = _id.ToString(),
            [SSISchemaService.SchemaAttribute_Internal_DateIssued] = OriginalDate.ToString("O")
          }
        };
        var settings = new AppSettings
        {
          SSIEnabledEnvironments = "Local",
          YomaOrganizationName = "Yoma",
          SSIMaximumRetryAttempts = 2,
          SSIParallelism = new AppSettingsSSIParallelism { CredentialIssuance = parallelism }
        };
        var schema = new SSISchema
        {
          Id = "new-schema",
          Name = Item.SchemaName,
          Type = type,
          ArtifactType = Item.ArtifactType,
          Version = new Version(1, 1),
          Entities = []
        };
        var schemas = new Mock<ISSISchemaService>();
        schemas.Setup(service => service.GetByFullName(Item.SchemaName)).ReturnsAsync(schema);
        var statuses = new Mock<ISSICredentialIssuanceStatusService>();
        statuses.Setup(service => service.GetByName(It.IsAny<string>())).Returns((string name) =>
          new SSICredentialIssuanceStatus { Id = _statusIds[Enum.Parse<CredentialIssuanceStatus>(name)] });
        var repository = new Mock<IRepository<SSICredentialIssuance>>();
        repository.Setup(value => value.Query()).Returns(() => _items.Values.Select(Clone).AsQueryable());
        repository.Setup(value => value.Update(It.IsAny<SSICredentialIssuance>())).ReturnsAsync((SSICredentialIssuance item) =>
        {
          BeforeSave?.Invoke(item);
          _items[item.Id] = Clone(item);
          return item;
        });
        var types = new Mock<ISSISchemaTypeService>();
        types.Setup(service => service.GetByName(SchemaType.Opportunity.ToString()))
          .Returns(new SSISchemaType { Id = type == SchemaType.Opportunity ? typeId : Guid.NewGuid() });
        var tenantStatusId = Guid.NewGuid();
        var tenantStatuses = new Mock<ISSITenantCreationStatusService>();
        tenantStatuses.Setup(service => service.GetByName(TenantCreationStatus.Created.ToString())).Returns(new SSITenantCreationStatus { Id = tenantStatusId });
        var tenants = new Mock<IRepository<SSITenantCreation>>();
        tenants.Setup(repository => repository.Query()).Returns(new[]
        {
          new SSITenantCreation { EntityType = "User", UserId = participation.UserId, StatusId = tenantStatusId, TenantId = "holder" },
          new SSITenantCreation { EntityType = "Organization", OrganizationId = participation.OrganizationId, StatusId = tenantStatusId, TenantId = "issuer" }
        }.AsQueryable());
        var participations = new Mock<IRepositoryBatchedWithNavigationAndCustomFieldFilter<Domain.MyOpportunity.Models.MyOpportunity>>();
        participations.Setup(repository => repository.Query()).Returns(() => _participations.AsQueryable());
        var credentialService = new SSICredentialService(Options.Create(settings), schemas.Object, statuses.Object,
          repository.Object, types.Object, tenantStatuses.Object, tenants.Object, participations.Object);
        Tenants.Setup(service => service.GetTenantId(EntityType.User, participation.UserId)).Returns("holder");
        Tenants.Setup(service => service.GetTenantIdOrNull(It.IsAny<EntityType>(), It.IsAny<Guid>())).Returns((EntityType entity, Guid _) => entity == EntityType.User ? "holder" : "issuer");
        var users = new Mock<IUserService>();
        users.Setup(service => service.GetById(participation.UserId, true, true)).Returns(new User { Id = participation.UserId, Username = "test" });
        var organizations = new Mock<IOrganizationService>();
        organizations.Setup(service => service.GetByNameOrNull("Yoma", true, true)).Returns(new Organization { Id = participation.OrganizationId });
        var myOpportunities = new Mock<IMyOpportunityService>();
        myOpportunities.Setup(service => service.GetById(It.IsAny<Guid>(), true, true, false))
          .Returns((Guid id, bool _, bool _, bool _) => _participations.Single(item => item.Id == id));
        var opportunities = new Mock<IOpportunityService>();
        opportunities.Setup(service => service.GetById(It.IsAny<Guid>(), true, true, false)).Returns(new Domain.Opportunity.Models.Opportunity { Type = Domain.Opportunity.Type.Other });
        Provider.Setup(client => client.GetCredentialByIdOrNull("holder", It.IsAny<ArtifactType>(), It.IsAny<string>()))
          .ReturnsAsync((string _, ArtifactType _, string id) => Credentials.GetValueOrDefault(id));
        Provider.Setup(client => client.GetCredentialByClientReferentOrNull("holder", It.IsAny<ArtifactType>(), It.IsAny<KeyValuePair<string, string>>()))
          .ReturnsAsync((string _, ArtifactType _, KeyValuePair<string, string> referent) => Credentials.Values.SingleOrDefault(credential =>
            credential.Attributes.TryGetValue(referent.Key, out var value) && value == referent.Value));
        Provider.Setup(client => client.GetSchemaById("old-schema")).ReturnsAsync(() => ProviderSchema);
        Provider.Setup(client => client.DeleteCredential("holder", It.IsAny<ArtifactType>(), It.IsAny<string>())).Returns((string _, ArtifactType _, string id) =>
        {
          Assert.Null(System.Transactions.Transaction.Current);
          BeforeDelete?.Invoke();
          Credentials.TryRemove(id, out _);
          return Task.CompletedTask;
        });
        Provider.Setup(client => client.IssueCredential(It.IsAny<CredentialIssuanceRequest>())).ReturnsAsync((CredentialIssuanceRequest request) =>
        {
          BeforeIssue?.Invoke();
          lock (Requests) Requests.Add(request);
          var credential = new Credential { Id = Guid.NewGuid().ToString(), SchemaId = request.SchemaId, Attributes = request.Attributes };
          Credentials[credential.Id] = credential;
          return credential;
        });
        var factory = new Mock<ISSIProviderClientFactory>();
        factory.Setup(value => value.CreateClient()).Returns(Provider.Object);
        var lifetime = new Mock<IHostApplicationLifetime>();
        lifetime.SetupGet(value => value.ApplicationStopping).Returns(stopping);
        var environment = new Mock<IEnvironmentProvider>();
        environment.SetupGet(value => value.Environment).Returns(Domain.Core.Environment.Local);
        Lock.Setup(value => value.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>())).ReturnsAsync(true);
        _services = new ServiceCollection()
          .AddSingleton<ISSICredentialService>(credentialService)
          .AddSingleton(schemas.Object)
          .AddSingleton(Tenants.Object)
          .AddSingleton(users.Object)
          .AddSingleton(organizations.Object)
          .AddSingleton(myOpportunities.Object)
          .AddSingleton(opportunities.Object)
          .AddSingleton(Mock.Of<ICustomFieldDefinitionService>())
          .AddSingleton(Mock.Of<ICustomFieldValueService>())
          .AddSingleton(factory.Object)
          .BuildServiceProvider();
        Background = new SSIBackgroundService(Mock.Of<ILogger<SSIBackgroundService>>(), Options.Create(settings), environment.Object,
          Options.Create(new ScheduleJobOptions { SSICredentialIssuanceScheduleBatchSize = 10, SSICredentialIssuanceScheduleMaxIntervalInHours = 1 }),
          _services.GetRequiredService<IServiceScopeFactory>(), schemas.Object, Mock.Of<ISSISchemaEntityService>(),
          Tenants.Object, credentialService, Lock.Object, lifetime.Object);
      }
      #endregion Constructor

      #region Public Members
      public void AddReplay()
      {
        var item = Clone(Item);
        item.Id = Guid.NewGuid();
        item.CredentialId = Guid.NewGuid().ToString();
        var original = _participations[0];
        var participation = new Domain.MyOpportunity.Models.MyOpportunity
        {
          Id = Guid.NewGuid(),
          OpportunityId = Guid.NewGuid(),
          UserId = original.UserId,
          OrganizationId = original.OrganizationId
        };
        _participations.Add(participation);
        item.MyOpportunityId = participation.Id;
        _items[item.Id] = item;
        Credentials[item.CredentialId] = new Credential
        {
          Id = item.CredentialId,
          SchemaId = "old-schema",
          Attributes = new Dictionary<string, string>
          {
            [SSISchemaService.SchemaAttribute_Internal_ReferentClient] = item.Id.ToString(),
            [SSISchemaService.SchemaAttribute_Internal_DateIssued] = OriginalDate.ToString("O")
          }
        };
      }

      public void AddPending()
      {
        var item = Clone(Item);
        item.Id = Guid.NewGuid();
        item.Status = CredentialIssuanceStatus.Pending;
        item.StatusId = _statusIds[CredentialIssuanceStatus.Pending];
        item.CredentialId = null;
        item.SchemaVersion = null;
        _items[item.Id] = item;
      }

      public void Dispose() => _services.Dispose();
      #endregion Public Members

      #region Private Members
      // Match detached EF projections: changing a work item must not mutate the persisted row on a failed save.
      private static SSICredentialIssuance Clone(SSICredentialIssuance item) =>
        JsonConvert.DeserializeObject<SSICredentialIssuance>(JsonConvert.SerializeObject(item))!;
      #endregion Private Members
    }
    #endregion Fixture
  }
}
