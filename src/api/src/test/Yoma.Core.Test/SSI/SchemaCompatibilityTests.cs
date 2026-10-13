using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Domain.SSI.Services;
using Yoma.Core.Domain.SSI.Validators;

namespace Yoma.Core.Test.SSI
{
  public class SchemaCompatibilityTests
  {
    #region Tests
    [Fact]
    public async Task StageSelectsOriginalDefaultAndPreservesHistoricalIdentity()
    {
      using var fixture = new Fixture(Domain.Core.Environment.Staging);
      var schema = await fixture.Service.GetByFullName("YoID|Default");
      Assert.Equal("original", schema.Id);
      Assert.Equal(new Version(1, 0), schema.Version);
      Assert.Contains(schema.Entities.SelectMany(entity => entity.Properties!),
        property => property.AttributeName == "User_Email");
      Assert.Equal("original", (await fixture.Service.GetById("original")).Id);
      await Assert.ThrowsAsync<EntityNotFoundException>(() => fixture.Service.GetById("cf"));
      Assert.Equal(2, fixture.Schemas.Count);
      Assert.Contains("User_AccountVerificationMethods", fixture.Schemas[1].AttributeNames);
      Assert.Contains(fixture.Logger.Invocations, invocation => invocation.Method.Name == "Log" &&
        invocation.Arguments[0] is LogLevel.Warning &&
        invocation.Arguments[2]?.ToString()?.Contains("Stage YoID schema compatibility fallback") == true);
      fixture.Provider.Verify(provider => provider.UpsertSchema(It.IsAny<SchemaRequest>()), Times.Never);
    }

    [Theory]
    [InlineData(Domain.Core.Environment.Production)]
    [InlineData(Domain.Core.Environment.Development)]
    [InlineData(Domain.Core.Environment.Local)]
    [InlineData(Domain.Core.Environment.None)]
    [InlineData(Domain.Core.Environment.Staging | Domain.Core.Environment.Production)]
    public async Task OtherEnvironmentsRetainStrictMismatchFailure(Domain.Core.Environment environment)
    {
      using var fixture = new Fixture(environment);
      await Assert.ThrowsAsync<DataInconsistencyException>(() => fixture.Service.List(SchemaType.YoID));
      Assert.DoesNotContain(fixture.Logger.Invocations, invocation => invocation.Method.Name == "Log");
    }

    [Fact]
    public async Task StageWithoutCompatibleDefaultStillFails()
    {
      using var fixture = new Fixture(Domain.Core.Environment.Staging);
      fixture.Schemas.RemoveAt(0);
      await Assert.ThrowsAsync<DataInconsistencyException>(() => fixture.Service.List(SchemaType.YoID));
    }

    [Fact]
    public async Task StageDoesNotBypassCustomSchemaMismatch()
    {
      using var fixture = new Fixture(Domain.Core.Environment.Staging);
      fixture.Schemas[1].Name = "YoID|Custom";
      await Assert.ThrowsAsync<DataInconsistencyException>(() => fixture.Service.List(SchemaType.YoID));
    }

    [Fact]
    public async Task StageDoesNotBypassJwsMismatch()
    {
      using var fixture = new Fixture(Domain.Core.Environment.Staging);
      fixture.Schemas[1].ArtifactType = ArtifactType.JWS;
      await Assert.ThrowsAsync<DataInconsistencyException>(() => fixture.Service.List(SchemaType.YoID));
    }

    [Fact]
    public async Task StageUsesLatestCompatibleVersionRegardlessOfProviderOrder()
    {
      using var fixture = new Fixture(Domain.Core.Environment.Staging);
      fixture.Schemas.Add(new Schema
      {
        Id = "restored",
        Name = "YoID|Default",
        Version = new Version(1, 2),
        ArtifactType = ArtifactType.ACR,
        AttributeNames = [.. fixture.Schemas[0].AttributeNames]
      });
      fixture.Schemas.Reverse();
      Assert.Equal("restored", (await fixture.Service.GetByFullName("YoID|Default")).Id);
      Assert.Equal("original", (await fixture.Service.GetById("original")).Id);
    }

    [Fact]
    public async Task StageAutomaticallyAcceptsNewVersionOnceCatalogueSupportsIt()
    {
      using var fixture = new Fixture(Domain.Core.Environment.Staging);
      fixture.Entities.Single(entity => entity.Name == "User").Properties!.Add(new()
      {
        Name = "AccountVerificationMethods",
        AttributeName = "User_AccountVerificationMethods"
      });
      Assert.Equal("cf", (await fixture.Service.GetByFullName("YoID|Default")).Id);
      Assert.Empty(fixture.Logger.Invocations);
    }

    [Fact]
    public async Task StageDoesNotHideDuplicateMetadataMismatch()
    {
      using var fixture = new Fixture(Domain.Core.Environment.Staging);
      fixture.Entities.Single(entity => entity.Name == "User").Properties!.Add(new()
      {
        Name = "Email",
        AttributeName = "User_Email"
      });
      await Assert.ThrowsAsync<DataInconsistencyException>(() => fixture.Service.List(SchemaType.YoID));
    }
    #endregion Tests

    #region Fixture
    private sealed class Fixture : IDisposable
    {
      private readonly MemoryCache _cache = new(new MemoryCacheOptions());
      public Mock<ILogger<SSISchemaService>> Logger { get; } = new();
      public Mock<ISSIProviderClient> Provider { get; } = new(MockBehavior.Strict);
      public List<Schema> Schemas { get; }
      public List<SSISchemaEntity> Entities { get; }
      public SSISchemaService Service { get; }

      public Fixture(Domain.Core.Environment environment)
      {
        var type = new SSISchemaType { Id = Guid.NewGuid(), Name = "YoID", Type = SchemaType.YoID };
        var attributes = new List<string>
        {
          "Organization_Name", "Organization_LogoURL", "User_DisplayName", "User_FirstName",
          "User_Surname", "User_DateOfBirth", "User_Email", "User_Gender", "User_Education", "User_Country"
        };
        Entities = [.. attributes.GroupBy(attribute => attribute.Split('_')[0]).Select(group => new SSISchemaEntity
        {
          Id = Guid.NewGuid(),
          Name = group.Key,
          Types = [type],
          Properties = [.. group.Select(attribute => new SSISchemaEntityProperty
          {
            Name = attribute[(attribute.IndexOf('_') + 1)..],
            AttributeName = attribute
          })]
        })];
        Schemas =
        [
          new()
          {
            Id = "original",
            Name = "YoID|Default",
            Version = new Version(1, 0),
            ArtifactType = ArtifactType.ACR,
            AttributeNames = [.. SSISchemaService.SchemaAttributes_Internal, .. attributes]
          },
          new()
          {
            Id = "cf",
            Name = "YoID|Default",
            Version = new Version(1, 1),
            ArtifactType = ArtifactType.ACR,
            AttributeNames = [.. SSISchemaService.SchemaAttributes_Internal,
              .. attributes.Where(attribute => attribute != "User_Email"), "User_AccountVerificationMethods"]
          }
        ];
        Logger.Setup(logger => logger.IsEnabled(LogLevel.Warning)).Returns(true);
        var settings = new AppSettings { SSISchemaFullNameYoID = "YoID|Default", CacheEnabledByCacheItemTypes = "None" };
        var environmentProvider = new Mock<IEnvironmentProvider>();
        environmentProvider.SetupGet(provider => provider.Environment).Returns(environment);
        Provider.Setup(provider => provider.ListSchemas(false)).ReturnsAsync(() => [.. Schemas]);
        var factory = new Mock<ISSIProviderClientFactory>();
        factory.Setup(provider => provider.CreateClient()).Returns(Provider.Object);
        var entityService = new Mock<ISSISchemaEntityService>();
        entityService.Setup(service => service.ListAll(null, false)).Returns(() => Entities);
        var typeService = new Mock<ISSISchemaTypeService>();
        typeService.Setup(service => service.GetByNameOrNull("YoID")).Returns(type);
        Service = new SSISchemaService(Logger.Object, Options.Create(settings), _cache, environmentProvider.Object,
          factory.Object, entityService.Object, Mock.Of<ICustomFieldDefinitionService>(), typeService.Object,
          new SchemaRequestValidatorCreate(entityService.Object, typeService.Object),
          new SchemaRequestValidatorUpdate(entityService.Object));
      }

      public void Dispose() => _cache.Dispose();
    }
    #endregion Fixture
  }
}
