using Microsoft.AspNetCore.Http;
using Moq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using System.Security.Claims;
using Xunit;
using Yoma.Core.Domain.Core.Converters;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Services;
using Yoma.Core.Domain.SSI.Validators;

namespace Yoma.Core.Test.SSI
{
  public class WalletCredentialTests
  {
    #region Tests
    [Theory]
    [InlineData("Learning", null, Domain.Opportunity.Type.Learning)]
    [InlineData("Other", null, Domain.Opportunity.Type.Other)]
    [InlineData("Event", null, Domain.Opportunity.Type.Event)]
    [InlineData("Job", null, Domain.Opportunity.Type.Job)]
    [InlineData("ImpactAction", null, Domain.Opportunity.Type.ImpactAction)]
    [InlineData("Entrepreneurship", null, Domain.Opportunity.Type.Entrepreneurship)]
    [InlineData("Task", null, Domain.Opportunity.Type.ImpactAction)]
    [InlineData("task", "Job", Domain.Opportunity.Type.ImpactAction)]
    [InlineData(" Task ", null, Domain.Opportunity.Type.ImpactAction)]
    [InlineData("Learning", "Job", Domain.Opportunity.Type.Learning)]
    [InlineData("  jOb  ", null, Domain.Opportunity.Type.Job)]
    [InlineData(null, "Job", null)]
    [InlineData("n/a", "ImpactAction", null)]
    [InlineData("UnknownHistoricalType", "Event", null)]
    [InlineData(null, " entrepreneurship ", null)]
    [InlineData(null, null, null)]
    [InlineData("", null, null)]
    [InlineData("n/a", null, null)]
    [InlineData("UnknownHistoricalType", null, null)]
    [InlineData("999", null, null)]
    [InlineData("1", null, null)]
    [InlineData("Learning,Job", null, null)]
    [InlineData("Task,Job", null, null)]
    [InlineData("Impact Action", null, null)]
    [InlineData("Job opportunity", null, null)]
    [InlineData(null, "UnknownHistoricalType", null)]
    public async Task ListAndDetailExposeGenericTypeContextFromOnlySignedOpportunityTypeWithoutAnotherLookup(
      string? signedType, string? context, Domain.Opportunity.Type? expected)
    {
      var fixture = new Fixture(SchemaType.Opportunity, context, signedType);

      var results = await fixture.Service.SearchUserCredentials(new SSIWalletSearchFilter { PageNumber = 1, PageSize = 10 });
      var info = Assert.Single(results.Items!);
      var detail = await fixture.Service.GetUserCredentialById(fixture.Credential.Id);

      Assert.Equal(expected?.ToString(), info.TypeContext);
      Assert.Equal(expected?.ToString(), detail.TypeContext);
      Assert.DoesNotContain(detail.Attributes, attribute => attribute.Name == "Opportunity_Type");
      Assert.Equal(signedType, fixture.Credential.Attributes.TryGetValue("opportunity_type", out var value) ? value : null);
      AssertJsonContext(info, expected);
      AssertJsonContext(detail, expected);
      fixture.AssertReadsOnlyIssuedSchema();
    }

    [Fact]
    public async Task YoIDHasNoTypeContextFromUnexpectedAttributesOrSchemaContext()
    {
      var fixture = new Fixture(SchemaType.YoID, "Job", "Learning");

      var results = await fixture.Service.SearchUserCredentials(new SSIWalletSearchFilter { PageNumber = 1, PageSize = 10 });
      var info = Assert.Single(results.Items!);
      var detail = await fixture.Service.GetUserCredentialById(fixture.Credential.Id);

      Assert.Null(info.TypeContext);
      Assert.Null(detail.TypeContext);
      AssertJsonContext(info, null);
      AssertJsonContext(detail, null);
      fixture.AssertReadsOnlyIssuedSchema();
    }
    #endregion Tests

    #region Private Members
    private static void AssertJsonContext(SSICredentialBase credential, Domain.Opportunity.Type? expected)
    {
      var settings = new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() };
      settings.Converters.Add(new StrictStringEnumConverter { AllowIntegerValues = true, RejectUndefinedValues = true });
      var json = JObject.Parse(JsonConvert.SerializeObject(credential, settings));

      Assert.True(json.ContainsKey("typeContext"));
      Assert.Equal(expected?.ToString(), json.Value<string>("typeContext"));
      Assert.Equal(credential.SchemaType.ToString(), json.Value<string>("schemaType"));
      Assert.False(json.ContainsKey("opportunityType"));
      if (credential is SSICredentialInfo) Assert.False(json.ContainsKey("attributes"));
    }

    private sealed class Fixture
    {
      public Domain.SSI.Models.Provider.Credential Credential { get; }
      public Mock<ISSIProviderClient> Provider { get; } = new(MockBehavior.Strict);
      public Mock<ISSISchemaService> Schemas { get; } = new(MockBehavior.Strict);
      public SSIWalletService Service { get; }

      public Fixture(SchemaType schemaType, string? context, string? signedType)
      {
        var user = new User { Id = Guid.NewGuid(), Username = "wallet-test" };
        var users = new Mock<IUserService>(MockBehavior.Strict);
        users.Setup(service => service.GetByUsername(user.Username, false, false)).Returns(user);
        var tenants = new Mock<ISSITenantService>(MockBehavior.Strict);
        tenants.Setup(service => service.GetTenantId(EntityType.User, user.Id)).Returns("holder");
        tenants.Setup(service => service.GetTenantIdOrNull(EntityType.User, user.Id)).Returns("holder");
        var httpContext = new HttpContextAccessor
        {
          HttpContext = new DefaultHttpContext
          {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, user.Username)], "Test"))
          }
        };

        Credential = new Domain.SSI.Models.Provider.Credential
        {
          Id = "credential-v1",
          SchemaId = "issued-schema-v1",
          Attributes = new Dictionary<string, string>()
        };
        if (signedType != null) Credential.Attributes.Add("opportunity_type", signedType);
        Provider.Setup(client => client.ListCredentials("holder")).ReturnsAsync([Credential]);
        Provider.Setup(client => client.GetCredentialById("holder", Credential.Id)).ReturnsAsync(Credential);
        Schemas.Setup(service => service.GetById(Credential.SchemaId)).ReturnsAsync(new SSISchema
        {
          Id = Credential.SchemaId,
          Name = "Historical custom schema",
          Type = schemaType,
          TypeContext = context,
          Version = new Version(1, 0),
          ArtifactType = schemaType == SchemaType.YoID ? ArtifactType.ACR : ArtifactType.JWS,
          Entities = schemaType == SchemaType.Opportunity && signedType != null
            ? [new SSISchemaEntity
            {
              Name = nameof(Domain.Opportunity.Models.Opportunity),
              Properties = [new SSISchemaEntityProperty
              {
                Name = nameof(Domain.Opportunity.Models.Opportunity.Type),
                AttributeName = "Opportunity_Type",
                System = true,
                SystemType = SchemaEntityPropertySystemType.OpportunityType,
                Required = true
              }]
            }]
            : []
        });

        var factory = new Mock<ISSIProviderClientFactory>(MockBehavior.Strict);
        factory.Setup(service => service.CreateClient()).Returns(Provider.Object);
        Service = new SSIWalletService(httpContext, users.Object, factory.Object, tenants.Object,
          Schemas.Object, new SSIWalletSearchFilterValidator());
      }

      public void AssertReadsOnlyIssuedSchema()
      {
        Schemas.Verify(service => service.GetById(Credential.SchemaId), Times.Exactly(2));
        Schemas.VerifyNoOtherCalls();
        Provider.Verify(client => client.ListCredentials("holder"), Times.Once);
        Provider.Verify(client => client.GetCredentialById("holder", Credential.Id), Times.Once);
        Provider.VerifyNoOtherCalls();
      }
    }
    #endregion Private Members
  }
}
