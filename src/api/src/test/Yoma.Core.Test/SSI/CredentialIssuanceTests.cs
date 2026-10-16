using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Test.SSI
{
  public class CredentialIssuanceTests
  {
    #region Tests
    [Theory]
    [InlineData(Domain.Opportunity.Type.Other)]
    [InlineData(Domain.Opportunity.Type.Learning)]
    [InlineData(Domain.Opportunity.Type.ImpactAction)]
    [InlineData(Domain.Opportunity.Type.Event)]
    [InlineData(Domain.Opportunity.Type.Job)]
    [InlineData(Domain.Opportunity.Type.Entrepreneurship)]
    [InlineData(null)]
    public async Task IssuancePinsTheMappedSchemaEvenWhenLatestChangesDuringTheAttempt(Domain.Opportunity.Type? type)
    {
      using var fixture = new Fixture(type);
      var original = fixture.LatestSchema;
      fixture.BeforeIssue = _ => fixture.AddVersion(new Version(1, 1));

      await fixture.Background.ProcessCredentialIssuance();

      var request = Assert.Single(fixture.Requests);
      Assert.Equal(original.Id, request.SchemaId);
      Assert.Equal(original.Name, request.SchemaName);
      Assert.Equal(original.ArtifactType, request.ArtifactType);
      Assert.Equal(fixture.Item.Id.ToString(), request.ClientReferent.Value);
      Assert.Contains(fixture.Item.SchemaType == SchemaType.YoID ? "User_DisplayName" : "Opportunity_Title", request.Attributes.Keys);
      Assert.Equal(CredentialIssuanceStatus.Issued, fixture.Item.Status);
      Assert.Equal("1.0", fixture.Item.SchemaVersion);
      Assert.Equal(1, fixture.SignatureCount);
      fixture.Schemas.Verify(service => service.GetByFullName(fixture.Item.SchemaName), Times.Once);
      fixture.Schemas.Verify(service => service.GetById(It.IsAny<string>()), Times.Never);
      fixture.Lock.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Theory]
    [InlineData(Domain.Opportunity.Type.Job)]
    [InlineData(null)]
    public async Task ProviderSuccessLocalFailureRetryKeepsTheActualIssuedVersionAndDoesNotIssueTwice(Domain.Opportunity.Type? type)
    {
      using var fixture = new Fixture(type);
      var original = fixture.LatestSchema;
      var failIssuedSave = true;
      fixture.Repository.Setup(repository => repository.Update(It.IsAny<SSICredentialIssuance>()))
        .ReturnsAsync((SSICredentialIssuance item) =>
        {
          if (item.Status == CredentialIssuanceStatus.Issued && failIssuedSave)
          {
            failIssuedSave = false;
            throw new InvalidOperationException("Simulated local save failure after provider success");
          }
          return item;
        });

      await fixture.Background.ProcessCredentialIssuance();
      Assert.Equal(CredentialIssuanceStatus.Pending, fixture.Item.Status);
      Assert.Null(fixture.Item.SchemaVersion);
      Assert.Equal(1, fixture.SignatureCount);
      fixture.AddVersion(new Version(1, 1));

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(2, fixture.Requests.Count);
      Assert.Equal(original.Id, fixture.Requests[0].SchemaId);
      Assert.Equal(fixture.LatestSchema.Id, fixture.Requests[1].SchemaId);
      Assert.All(fixture.Requests, request => Assert.Equal(fixture.Item.Id.ToString(), request.ClientReferent.Value));
      Assert.Equal(1, fixture.SignatureCount);
      Assert.Equal(CredentialIssuanceStatus.Issued, fixture.Item.Status);
      Assert.Equal(fixture.IssuedCredential!.Id, fixture.Item.CredentialId);
      Assert.Equal("1.0", fixture.Item.SchemaVersion);
      Assert.Null(fixture.Item.ErrorReason);
      fixture.Schemas.Verify(service => service.GetById(original.Id), Times.Once);
    }

    [Theory]
    [InlineData("different-name")]
    [InlineData("different-type")]
    [InlineData("different-artifact")]
    [InlineData("unknown-schema")]
    [InlineData("empty-credential-id")]
    [InlineData("empty-schema-id")]
    public async Task InvalidProviderRecoveryDoesNotMarkTheScheduleIssued(string mismatch)
    {
      using var fixture = new Fixture(Domain.Opportunity.Type.Job);
      var recovered = fixture.AddVersion(new Version(0, 9));
      var credential = new Credential
      {
        Id = Guid.NewGuid().ToString(),
        SchemaId = recovered.Id,
        Attributes = new Dictionary<string, string>()
      };
      switch (mismatch)
      {
        case "different-name": recovered.Name = "Opportunity|Custom"; break;
        case "different-type": recovered.Type = SchemaType.YoID; break;
        case "different-artifact": recovered.ArtifactType = ArtifactType.ACR; break;
        case "unknown-schema": credential.SchemaId = "missing"; break;
        case "empty-credential-id": credential.Id = " "; break;
        case "empty-schema-id": credential.SchemaId = " "; break;
        default: throw new NotSupportedException($"Mismatch '{mismatch}' is not supported");
      }
      fixture.Provider.Setup(provider => provider.IssueCredential(It.IsAny<CredentialIssuanceRequest>()))
        .ReturnsAsync(credential);

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal(CredentialIssuanceStatus.Pending, fixture.Item.Status);
      Assert.Null(fixture.Item.SchemaVersion);
      Assert.Null(fixture.Item.CredentialId);
      Assert.False(string.IsNullOrWhiteSpace(fixture.Item.ErrorReason));
    }

    [Fact]
    public async Task ProviderFailureRetainsScheduledNameAndRetriesWithoutAPinnedSuccessVersion()
    {
      using var fixture = new Fixture(Domain.Opportunity.Type.Job);
      fixture.Provider.Setup(provider => provider.IssueCredential(It.IsAny<CredentialIssuanceRequest>()))
        .ThrowsAsync(new InvalidOperationException("Simulated provider outage"));

      await fixture.Background.ProcessCredentialIssuance();

      Assert.Equal("Opportunity|Job|Default", fixture.Item.SchemaName);
      Assert.Equal(ArtifactType.JWS, fixture.Item.ArtifactType);
      Assert.Equal(CredentialIssuanceStatus.Pending, fixture.Item.Status);
      Assert.Null(fixture.Item.SchemaVersion);
      Assert.Null(fixture.Item.CredentialId);
      Assert.Equal("Simulated provider outage", fixture.Item.ErrorReason);
      fixture.Lock.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }
    #endregion Tests

    #region Fixture
    private sealed class Fixture : IDisposable
    {
      #region Class Variables
      private readonly ServiceProvider _services;
      private readonly List<SSISchema> _versions = [];

      public SSICredentialIssuance Item { get; }
      public Mock<ISSISchemaService> Schemas { get; } = new(MockBehavior.Strict);
      public Mock<ISSIProviderClient> Provider { get; } = new(MockBehavior.Strict);
      public Mock<IRepository<SSICredentialIssuance>> Repository { get; } = new();
      public Mock<IDistributedLockService> Lock { get; } = new();
      public List<CredentialIssuanceRequest> Requests { get; } = [];
      public Action<CredentialIssuanceRequest>? BeforeIssue { get; set; }
      public Credential? IssuedCredential { get; private set; }
      public int SignatureCount { get; private set; }
      public SSISchema LatestSchema => _versions.MaxBy(schema => schema.Version)!;
      public SSIBackgroundService Background { get; }
      #endregion Class Variables

      #region Constructor
      public Fixture(Domain.Opportunity.Type? type)
      {
        var settings = new AppSettings
        {
          SSIEnabledEnvironments = "Local",
          YomaOrganizationName = "Yoma",
          SSIMaximumRetryAttempts = 2,
          SSIParallelism = new AppSettingsSSIParallelism { CredentialIssuance = 1 }
        };
        var statusIds = Enum.GetValues<CredentialIssuanceStatus>().ToDictionary(status => status, _ => Guid.NewGuid());
        Item = new SSICredentialIssuance
        {
          Id = Guid.NewGuid(),
          SchemaType = type.HasValue ? SchemaType.Opportunity : SchemaType.YoID,
          ArtifactType = type.HasValue ? ArtifactType.JWS : ArtifactType.ACR,
          SchemaName = type.HasValue ? SSISSchemaHelper.ToDefaultFullName(type.Value) : "YoID|Default",
          StatusId = statusIds[CredentialIssuanceStatus.Pending],
          Status = CredentialIssuanceStatus.Pending,
          UserId = type.HasValue ? null : Guid.NewGuid(),
          MyOpportunityId = type.HasValue ? Guid.NewGuid() : null
        };
        AddVersion(new Version(1, 0));
        Schemas.Setup(service => service.GetByFullName(Item.SchemaName)).ReturnsAsync(() => LatestSchema);
        Schemas.Setup(service => service.GetById(It.IsAny<string>()))
          .ReturnsAsync((string id) => _versions.Single(schema => schema.Id == id));

        var statuses = new Mock<ISSICredentialIssuanceStatusService>();
        statuses.Setup(service => service.GetByName(It.IsAny<string>()))
          .Returns((string name) => new SSICredentialIssuanceStatus { Id = statusIds[Enum.Parse<CredentialIssuanceStatus>(name)] });
        Repository.Setup(repository => repository.Query()).Returns(() => new[] { Item }.AsQueryable());
        Repository.Setup(repository => repository.Update(It.IsAny<SSICredentialIssuance>()))
          .ReturnsAsync((SSICredentialIssuance item) => item);
        var credentialService = new SSICredentialService(
          Options.Create(settings),
          Schemas.Object,
          statuses.Object,
          Repository.Object);

        var tenants = new Mock<ISSITenantService>();
        tenants.Setup(service => service.GetTenantIdOrNull(It.IsAny<EntityType>(), It.IsAny<Guid>())).Returns("tenant");
        var users = new Mock<IUserService>();
        users.Setup(service => service.GetById(It.IsAny<Guid>(), true, true))
          .Returns(new User { Id = Item.UserId ?? Guid.NewGuid(), Username = "test", DisplayName = "Test youth" });
        var organizations = new Mock<IOrganizationService>();
        organizations.Setup(service => service.GetByNameOrNull("Yoma", true, true))
          .Returns(new Organization { Id = Guid.NewGuid(), Name = "Yoma" });
        var myOpportunities = new Mock<IMyOpportunityService>();
        myOpportunities.Setup(service => service.GetById(It.IsAny<Guid>(), true, true, false))
          .Returns(new Domain.MyOpportunity.Models.MyOpportunity
          {
            Id = Item.MyOpportunityId ?? Guid.NewGuid(),
            OpportunityId = Guid.NewGuid(),
            OrganizationId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            UserDisplayName = "Test youth"
          });
        var opportunities = new Mock<IOpportunityService>();
        opportunities.Setup(service => service.GetById(It.IsAny<Guid>(), true, true, false))
          .Returns(new Domain.Opportunity.Models.Opportunity { Type = type ?? Domain.Opportunity.Type.Other, Title = "Test opportunity" });

        Provider.Setup(provider => provider.IssueCredential(It.IsAny<CredentialIssuanceRequest>()))
          .ReturnsAsync((CredentialIssuanceRequest request) =>
          {
            Requests.Add(request);
            BeforeIssue?.Invoke(request);
            if (IssuedCredential == null)
            {
              SignatureCount++;
              IssuedCredential = new Credential
              {
                Id = Guid.NewGuid().ToString(),
                SchemaId = request.SchemaId,
                Attributes = request.Attributes
              };
            }
            return IssuedCredential;
          });
        var factory = new Mock<ISSIProviderClientFactory>();
        factory.Setup(service => service.CreateClient()).Returns(Provider.Object);
        var definitions = Mock.Of<ICustomFieldDefinitionService>();
        var values = Mock.Of<ICustomFieldValueService>();
        _services = new ServiceCollection()
          .AddSingleton<ISSICredentialService>(credentialService)
          .AddSingleton(Schemas.Object)
          .AddSingleton(users.Object)
          .AddSingleton(organizations.Object)
          .AddSingleton(myOpportunities.Object)
          .AddSingleton(opportunities.Object)
          .AddSingleton(definitions)
          .AddSingleton(values)
          .AddSingleton(tenants.Object)
          .AddSingleton(factory.Object)
          .BuildServiceProvider();

        var environment = new Mock<IEnvironmentProvider>();
        environment.SetupGet(provider => provider.Environment).Returns(Domain.Core.Environment.Local);
        Lock.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>())).ReturnsAsync(true);
        Background = new SSIBackgroundService(
          Mock.Of<ILogger<SSIBackgroundService>>(),
          Options.Create(settings),
          environment.Object,
          Options.Create(new ScheduleJobOptions
          {
            SSICredentialIssuanceScheduleBatchSize = 10,
            SSICredentialIssuanceScheduleMaxIntervalInHours = 1
          }),
          _services.GetRequiredService<IServiceScopeFactory>(),
          Schemas.Object,
          Mock.Of<ISSISchemaEntityService>(),
          tenants.Object,
          credentialService,
          Lock.Object);
      }
      #endregion Constructor

      #region Public Members
      public SSISchema AddVersion(Version version)
      {
        var schema = new SSISchema
        {
          Id = $"test:2:{Item.SchemaName}:{version}",
          Name = Item.SchemaName,
          Type = Item.SchemaType,
          Version = version,
          ArtifactType = Item.ArtifactType,
          Entities = Item.SchemaType == SchemaType.YoID
            ? [
              new SSISchemaEntity
              {
                Name = "User",
                TypeName = typeof(User).AssemblyQualifiedName!,
                Properties = [
                  new SSISchemaEntityProperty
                  {
                    Name = "DisplayName",
                    AttributeName = "User_DisplayName",
                    Required = true
                  }
                ]
              }
            ]
            : [
              new SSISchemaEntity
              {
                Name = "Opportunity",
                TypeName = typeof(Domain.Opportunity.Models.Opportunity).AssemblyQualifiedName!,
                Properties = [
                  new SSISchemaEntityProperty
                  {
                    Name = "Title",
                    AttributeName = "Opportunity_Title",
                    Required = true
                  }
                ]
              }
            ]
        };
        _versions.Add(schema);
        return schema;
      }

      public void Dispose() => _services.Dispose();
      #endregion Public Members
    }
    #endregion Fixture
  }
}
