using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using System.Reflection;
using System.Security.Claims;
using Xunit;
using Yoma.Core.Api.Middleware;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Test.Core.Fixtures;
using Yoma.Core.Test.SSI.Fixtures;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Domain.SSI.Services;
using Yoma.Core.Domain.SSI.Services.Lookups;
using Yoma.Core.Domain.SSI.Validators;

namespace Yoma.Core.Test.SSI
{
  public class DefaultSchemaTests
  {
    #region Class Variables
    private static readonly string[] RequiredCoreAttributes =
    [
      "User_DisplayName", "Organization_Name", "Opportunity_Title", "Opportunity_Type",
      "Opportunity_OrganizationName", "MyOpportunity_UserDisplayName"
    ];
    private static readonly string[] YoIDBodyAttributes =
    [
      "User_FirstName", "User_Surname", "User_DateOfBirth", "User_Country",
      "User_Gender", "User_Education", "User_AccountVerificationMethods"
    ];
    private static readonly string[] EmailAndSocialVerificationMethods = ["Email Verified", "Social Login"];
    private static readonly string[] FundingDisplayValues = ["Grants, donations", "Bootstrapping"];
    private static readonly string[] MultiValueDisplayValues = ["First label, with a comma", "Second label — café"];
    #endregion Class Variables

    #region Tests
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task CrossTypeSchemaAttributesReturnBadRequestWithoutProviderWrites(bool update)
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      fixture.Provider.Invocations.Clear();

      Func<Task> action = update
        ? () => fixture.Service.Update(new SSISchemaRequestUpdate
        {
          Name = "Opportunity|Event|Default",
          Attributes = ["Opportunity_JobIndustry"]
        })
        : () => fixture.Service.Create(new SSISchemaRequestCreate
        {
          TypeId = fixture.Entities.Single(entity => entity.Name == "Opportunity").Types!.Single().Id,
          TypeContext = "Event",
          Name = "Invalid Event Selection",
          ArtifactType = ArtifactType.JWS,
          Attributes = ["Opportunity_JobIndustry"]
        });

      var exception = await Assert.ThrowsAsync<ValidationException>(action);
      Assert.Contains("Opportunity_JobIndustry", exception.Message);
      var context = new DefaultHttpContext();
      using var response = new MemoryStream();
      context.Response.Body = response;
      await new ExceptionResponseMiddleware(_ => Task.FromException(exception)).InvokeAsync(context);
      Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
      fixture.Provider.Verify(client => client.UpsertSchema(It.IsAny<SchemaRequest>()), Times.Never);
      Assert.Equal(6, fixture.Schemas.Count);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task InvalidSchemaContextReturnsBadRequest(bool entityLookup)
    {
      using var fixture = new Fixture();
      Func<Task> action = entityLookup
        ? () => Task.FromResult(fixture.EntityService.List(SchemaType.Opportunity, "UnsupportedType"))
        : () => fixture.Service.List(SchemaType.Opportunity, "UnsupportedType");

      var exception = await Assert.ThrowsAsync<ValidationException>(action);
      Assert.Contains("UnsupportedType", exception.Message);
      var context = new DefaultHttpContext();
      using var response = new MemoryStream();
      context.Response.Body = response;
      await new ExceptionResponseMiddleware(_ => Task.FromException(exception)).InvokeAsync(context);
      Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
      fixture.Provider.Verify(client => client.UpsertSchema(It.IsAny<SchemaRequest>()), Times.Never);
    }

    [Fact]
    public async Task AddingBusinessLocationPublishesOneNewDefaultVersion()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();

      var original = fixture.Schemas.Single(schema => schema.Name == "Opportunity|Entrepreneurship|Default");
      original.AttributeNames.Remove("MyOpportunity_Location");

      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var current = await fixture.Service.GetByFullName(original.Name);
      Assert.NotEqual(original.Id, current.Id);
      Assert.Equal(new Version(original.Version.Major, original.Version.Minor + 1), current.Version);
      Assert.Contains("MyOpportunity_Location", Attributes(current));
      Assert.Contains("MyOpportunity_EntrepreneurshipCustomerReach", Attributes(current));
      Assert.DoesNotContain(Attributes(current), attribute => attribute.Contains("ClientLocation"));
      Assert.DoesNotContain("MyOpportunity_Location", Attributes(await fixture.Service.GetById(original.Id)));

      var schemaCount = fixture.Schemas.Count;
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      Assert.Equal(schemaCount, fixture.Schemas.Count);
    }

    [Fact]
    public async Task PresentationOnlyChangesDoNotPublishAnotherSchemaVersion()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var identities = fixture.Schemas.Select(schema => (schema.Id, schema.Name, schema.Version)).ToList();

      var user = fixture.Entities.Single(entity => entity.Name == "MyOpportunity").Properties!
        .Single(property => property.Name == "UserDisplayName");
      user.NameDisplay = "Configured User Label";
      user.Group = "Configured Completion Group";
      user.SortOrder = 100;
      var role = fixture.Definitions.Single(definition => definition.Key == "EventRole");
      role.Title = "Configured Role Label";
      role.Group = "Configured Completion Group";
      role.SortOrder = 101;

      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      Assert.Equal(identities, fixture.Schemas.Select(schema => (schema.Id, schema.Name, schema.Version)));
      var schema = await fixture.Service.GetByFullName("Opportunity|Event|Default");
      Assert.Contains(schema.Entities.SelectMany(entity => entity.Properties ?? []),
        property => property.AttributeName == "MyOpportunity_UserDisplayName" && property.NameDisplay == user.NameDisplay);
      Assert.Contains(schema.Entities.SelectMany(entity => entity.CustomFields ?? []),
        field => field.Key == "EventRole" && field.Group == role.Group && field.SortOrder == role.SortOrder);
    }

    [Fact]
    public async Task ConfiguredCoreLabelsAndCustomFieldTitlesArePreservedThroughWalletDisplay()
    {
      using var fixture = new Fixture();
      fixture.Entities.Single(entity => entity.Name == "MyOpportunity").Properties!
        .Single(property => property.Name == "CommitmentIntervalDescription").NameDisplay = "iDX participation label";
      fixture.Definitions.Single(definition => definition.Key == "ImpactActionImpactAchieved").Title = "Reported IMPACT (custom)";

      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var schema = await fixture.Service.GetByFullName("Opportunity|ImpactAction|Default");
      var source = new Domain.MyOpportunity.Models.MyOpportunity
      {
        UserDisplayName = "Test Youth",
        CommitmentInterval = TimeIntervalOption.Hour,
        CommitmentIntervalCount = 1,
        CustomFields = [new() { Key = "ImpactActionImpactAchieved", DataType = CustomFieldDataType.String, ValueRaw = "Trees planted" }]
      };
      var request = new CredentialIssuanceRequest
      {
        SchemaId = schema.Id,
        SchemaName = schema.Name,
        ArtifactType = ArtifactType.JWS,
        Attributes = []
      };
      fixture.Map(request, schema, new Domain.Opportunity.Models.Opportunity
      {
        Title = "Completed action",
        Type = Domain.Opportunity.Type.ImpactAction,
        OrganizationName = "Issuer"
      });
      fixture.Map(request, schema, source);
      request.Attributes.Add(SSISchemaService.SchemaAttribute_Internal_DateIssued, "2026-10-11T10:00:00Z");
      var detail = await fixture.ReadWalletDetail(request, schema);
      Assert.Equal("iDX participation label", Assert.Single(detail.Attributes!, attribute => attribute.Name == "MyOpportunity_CommitmentIntervalDescription").NameDisplay);
      Assert.Equal("Reported IMPACT (custom)", Assert.Single(detail.Attributes!, attribute => attribute.Name == "MyOpportunity_ImpactActionImpactAchieved").NameDisplay);
    }

    [Fact]
    public async Task ImpactActionCompletionDetailsGroupsCoreAndBothCustomFieldsInOrder()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();

      var schema = await fixture.Service.GetByFullName("Opportunity|ImpactAction|Default");
      var fields = schema.Entities.SelectMany(entity => entity.CustomFields ?? []).ToList();
      var activity = Assert.Single(fields, field => field.Key == "ImpactActionVerifiedActivityType");
      var impact = Assert.Single(fields, field => field.Key == "ImpactActionImpactAchieved");
      Assert.Equal("Completion Details", activity.Group);
      Assert.Equal("Completion Details", impact.Group);
      Assert.Equal(3, activity.SortOrder);
      Assert.Equal(4, impact.SortOrder);
      Assert.Equal(fixture.Definitions.Single(definition => definition.Key == activity.Key).Title, activity.NameDisplay);
      Assert.Equal(fixture.Definitions.Single(definition => definition.Key == impact.Key).Title, impact.NameDisplay);

      var properties = schema.Entities.SelectMany(entity => entity.Properties ?? []).ToList();
      var commitment = Assert.Single(properties, property => property.AttributeName == "MyOpportunity_CommitmentIntervalDescription");
      Assert.Equal("Completion Details", commitment.Group);
      Assert.Equal(16, commitment.SortOrder);
      Assert.Equal("Duration", commitment.NameDisplay);
      Assert.Equal("Skills Earned", Assert.Single(properties, property => property.AttributeName == "Opportunity_Skills").NameDisplay);
    }

    [Theory]
    [InlineData(Domain.Opportunity.Type.Other, "Opportunity|Default")]
    [InlineData(Domain.Opportunity.Type.Learning, "Opportunity|Default")]
    [InlineData(Domain.Opportunity.Type.ImpactAction, "Opportunity|ImpactAction|Default")]
    [InlineData(Domain.Opportunity.Type.Event, "Opportunity|Event|Default")]
    [InlineData(Domain.Opportunity.Type.Job, "Opportunity|Job|Default")]
    [InlineData(Domain.Opportunity.Type.Entrepreneurship, "Opportunity|Entrepreneurship|Default")]
    public void CanonicalDefaultFollowsTypeAndPreservesExplicitCustomSelections(Domain.Opportunity.Type type, string expected)
    {
      Assert.Equal(expected, SSISSchemaHelper.ToDefaultFullName(type));
      Assert.Equal(expected, SSISSchemaHelper.ResolveOpportunitySchemaName(type, null));
      Assert.Equal(expected, SSISSchemaHelper.ResolveOpportunitySchemaName(type, " "));

      foreach (var currentType in Enum.GetValues<Domain.Opportunity.Type>())
      {
        var current = SSISSchemaHelper.ToDefaultFullName(currentType);
        Assert.Equal(expected, SSISSchemaHelper.ResolveOpportunitySchemaName(type, $" {current.ToLowerInvariant()} "));
      }

      // Applicability validation, not the resolver, rejects a missing or incompatible custom name.
      Assert.Equal("Opportunity|Custom", SSISSchemaHelper.ResolveOpportunitySchemaName(type, " Opportunity|Custom "));
      Assert.Equal("Opportunity|Job|Custom", SSISSchemaHelper.ResolveOpportunitySchemaName(type, "Opportunity|Job|Custom"));
    }

    [Fact]
    public void UnknownOpportunityTypeCannotSilentlyUseGenericDefault()
    {
      Assert.Throws<NotSupportedException>(() => SSISSchemaHelper.ToDefaultFullName((Domain.Opportunity.Type)999));
      Assert.Throws<NotSupportedException>(() => SSISSchemaHelper.ResolveOpportunitySchemaName((Domain.Opportunity.Type)999, null));
    }

    [Fact]
    public async Task FutureCanonicalSchedulesDoNotRedirectExistingQueueNamesOrPinTheirVersion()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();

      var schedules = new List<SSICredentialIssuance>();
      var repository = new Mock<IRepository<SSICredentialIssuance>>();
      repository.Setup(value => value.Query()).Returns(() => schedules.AsQueryable());
      repository.Setup(value => value.Create(It.IsAny<SSICredentialIssuance>()))
        .ReturnsAsync((SSICredentialIssuance item) =>
        {
          schedules.Add(item);
          return item;
        });
      var status = new Mock<ISSICredentialIssuanceStatusService>();
      status.Setup(value => value.GetByName(CredentialIssuanceStatus.Pending.ToString()))
        .Returns(new SSICredentialIssuanceStatus { Id = Guid.NewGuid() });
      var service = new SSICredentialService(Options.Create(fixture.Settings), fixture.Service,
        status.Object, repository.Object, Mock.Of<ISSISchemaTypeService>(), Mock.Of<ISSITenantCreationStatusService>(),
        Mock.Of<IRepository<SSITenantCreation>>(),
        Mock.Of<IRepositoryBatchedWithNavigationAndCustomFieldFilter<Domain.MyOpportunity.Models.MyOpportunity>>());

      await service.ScheduleIssuance("Opportunity|Default", Guid.NewGuid());
      var original = Assert.Single(schedules);
      Assert.Null(original.SchemaVersion);
      var schemaBefore = await fixture.Service.GetByFullName(original.SchemaName);
      await fixture.Service.Update(new()
      {
        Name = original.SchemaName,
        Attributes = ["Opportunity_Summary"]
      });

      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      await service.ScheduleIssuance(SSISSchemaHelper.ToDefaultFullName(Domain.Opportunity.Type.Job), Guid.NewGuid());

      Assert.Equal("Opportunity|Default", original.SchemaName);
      Assert.Null(original.SchemaVersion);
      Assert.Equal(ArtifactType.JWS, original.ArtifactType);
      Assert.Equal("Opportunity|Job|Default", schedules[1].SchemaName);
      Assert.True((await fixture.Service.GetByFullName(original.SchemaName)).Version > schemaBefore.Version);
      repository.Verify(value => value.Update(It.IsAny<SSICredentialIssuance>()), Times.Never);
    }

    [Theory]
    [InlineData(typeof(EngagementTypeOption), "OnSite", "On-site")]
    [InlineData(typeof(Domain.Opportunity.Type), "ImpactAction", "Impact Action")]
    [InlineData(typeof(EngagementTypeOption), "UnknownHistoricalValue", "UnknownHistoricalValue")]
    public void EnumPresentationUsesSharedDescriptionsWithoutChangingSignedValues(Type type, string value, string expected)
    {
      var property = new SSISchemaEntityProperty { DotNetType = type.AssemblyQualifiedName };
      var attribute = new KeyValuePair<string, string>("attribute", value);
      var method = typeof(SSIWalletService).GetMethod("ParseCredentialAttributeValue",
        BindingFlags.Static | BindingFlags.NonPublic, [typeof(SSISchemaEntityProperty), typeof(KeyValuePair<string, string>)])!;

      Assert.Equal(expected, method.Invoke(null, [property, attribute]));
      Assert.Equal(value, attribute.Value);
    }

    [Fact]
    public async Task SeedsBaseAndFourScopedDefaultsAndRetainsYoIDAnonCreds()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();

      Assert.Equal(6, fixture.Schemas.Count);
      var schemas = await fixture.Service.List((SchemaType?)null);
      var generic = Assert.Single(schemas, schema => schema.Name == "Opportunity|Default");
      Assert.Null(generic.TypeContext);
      Assert.Equal(ArtifactType.JWS, generic.ArtifactType);

      foreach (var context in new[] { "ImpactAction", "Event", "Job", "Entrepreneurship" })
      {
        var schema = Assert.Single(schemas, item => item.Name == $"Opportunity|{context}|Default");
        Assert.Equal(context, schema.TypeContext);
        Assert.Equal(ArtifactType.JWS, schema.ArtifactType);
        Assert.All(schema.Entities.SelectMany(entity => entity.CustomFields ?? []), field =>
        {
          Assert.Equal(context, field.TypeContext);
          Assert.False(field.Required);
          Assert.Null(field.SubGroup);
          Assert.False(string.IsNullOrWhiteSpace(field.Group));
          Assert.Equal(fixture.Definitions.Single(definition => definition.Id == field.Id).SortOrder,
            field.SortOrder);
        });
      }

      Assert.DoesNotContain(schemas, schema => schema.TypeContext is "Learning" or "Other");
      var yoID = Assert.Single(schemas, schema => schema.Type == SchemaType.YoID);
      Assert.Equal(ArtifactType.ACR, yoID.ArtifactType);
      Assert.Equal(10, Attributes(yoID).Count);
      Assert.Contains("User_AccountVerificationMethods", Attributes(yoID));
      Assert.DoesNotContain("User_Email", Attributes(yoID));
      Assert.Empty(yoID.Entities.SelectMany(entity => entity.CustomFields ?? []));
      Assert.DoesNotContain(Attributes(yoID), attribute =>
        attribute.Contains("Coordinates") || attribute.Contains("Preferences") || attribute.Contains("VerificationLevel"));

      fixture.Provider.Verify(client => client.IssueCredential(It.IsAny<CredentialIssuanceRequest>()), Times.Never);
    }

    [Fact]
    public async Task DefaultClaimsAreExplicitAndJobDoesNotAttestRequiredSkills()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();

      var schemas = await fixture.Service.List(SchemaType.Opportunity);
      var baseAttributes = Attributes(Assert.Single(schemas, schema => schema.TypeContext == null));

      foreach (var schema in schemas)
      {
        var attributes = Attributes(schema);
        Assert.Contains("MyOpportunity_Location", attributes);
        Assert.DoesNotContain("MyOpportunity_BusinessLocation", attributes);
        Assert.DoesNotContain("Opportunity_Countries", attributes);
        Assert.Contains("Opportunity_EngagementType", attributes);
        Assert.Contains("MyOpportunity_CommitmentIntervalDescription", attributes);
        Assert.Contains("Opportunity_VerificationMethod", attributes);
        Assert.Contains("MyOpportunity_VerificationEvidence", attributes);
        Assert.DoesNotContain("MyOpportunity_Verifications", attributes);
        Assert.DoesNotContain("MyOpportunity_UserDateOfBirth", attributes);
        Assert.DoesNotContain("MyOpportunity_DateCompleted", attributes);
        Assert.DoesNotContain("Opportunity_Difficulty", attributes);
        Assert.DoesNotContain(attributes, attribute => attribute.Contains("Coordinates"));

        Assert.Equal(schema.TypeContext != "Job", attributes.Contains("Opportunity_Skills"));
        Assert.DoesNotContain("MyOpportunity_Skills", attributes);

        // Every scoped seed retains the same core claims; Job deliberately excludes advertised skills.
        Assert.Equal(
          baseAttributes.Where(attribute => schema.TypeContext != "Job" || attribute != "Opportunity_Skills").Order(),
          schema.Entities.SelectMany(entity => entity.Properties ?? [])
            .Select(property => property.AttributeName).Order());
      }

      var expectedCounts = new Dictionary<string, int>
      {
        ["ImpactAction"] = 2,
        ["Event"] = 1,
        ["Job"] = 12,
        ["Entrepreneurship"] = 14
      };
      foreach (var schema in schemas)
        Assert.Equal(schema.TypeContext == null ? 0 : expectedCounts[schema.TypeContext],
          schema.Entities.Sum(entity => entity.CustomFields?.Count ?? 0));
    }

    [Fact]
    public async Task IdenticalAndReorderedStartupDoesNotCreateVersionsOrMutateSeedAttributes()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      fixture.Schemas.ForEach(schema => schema.AttributeNames = [.. schema.AttributeNames.Reverse()]);

      await fixture.Background.SeedSchemas();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();

      Assert.Equal(6, fixture.Schemas.Count);
      fixture.Provider.Verify(client => client.UpsertSchema(It.IsAny<SchemaRequest>()), Times.Exactly(6));
      Assert.All(fixture.Schemas, schema =>
        Assert.Equal(schema.AttributeNames.Count, schema.AttributeNames.Distinct().Count()));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("ImpactAction")]
    [InlineData("Event")]
    [InlineData("Job")]
    [InlineData("Entrepreneurship")]
    public async Task OpportunityTypeIsASystemPropertyAndCannotBeRemovedDuringSchemaManagement(string? context)
    {
      using var fixture = new Fixture();
      var type = Assert.Single(fixture.Entities, entity => entity.Name == "Opportunity")
        .Properties!.Single(property => property.Name == "Type");
      Assert.True(type.System);
      Assert.True(type.Required);
      Assert.Equal(SchemaEntityPropertySystemType.OpportunityType, type.SystemType);

      var created = await fixture.Service.Create(new SSISchemaRequestCreate
      {
        TypeId = fixture.Entities.Single(entity => entity.Name == "Opportunity").Types!.Single().Id,
        TypeContext = context,
        Name = "System type test",
        ArtifactType = ArtifactType.JWS,
        Attributes = ["Opportunity_Summary"]
      });
      Assert.Contains("Opportunity_Type", Attributes(created));

      // Omitting the type on update cannot remove it: the existing system-attribute prefix adds it back.
      var updated = await fixture.Service.Update(new SSISchemaRequestUpdate
      {
        Name = created.Name,
        Attributes = ["Opportunity_Summary"]
      });
      Assert.Contains("Opportunity_Type", Attributes(updated));
      Assert.Equal(SchemaEntityPropertySystemType.OpportunityType,
        updated.Entities.SelectMany(entity => entity.Properties ?? [])
          .Single(property => property.AttributeName == "Opportunity_Type").SystemType);
      Assert.All(fixture.Schemas, schema => Assert.Single(schema.AttributeNames, attribute => attribute == "Opportunity_Type"));
      fixture.AssertNoErrors();
    }

    [Fact]
    public async Task RemovalOnlyChangeCreatesOneVersionAndKeepsHistoricalSchemaReadable()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var original = Assert.Single(fixture.Schemas, schema => schema.Name == "Opportunity|Default");
      original.AttributeNames = [.. original.AttributeNames, "MyOpportunity_UserDateOfBirth", "MyOpportunity_DateCompleted"];

      await fixture.Background.SeedSchemas();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();

      var latest = await fixture.Service.GetByFullName("Opportunity|Default");
      Assert.Equal(new Version(1, 1), latest.Version);
      Assert.DoesNotContain("MyOpportunity_UserDateOfBirth", Attributes(latest));
      Assert.Contains("MyOpportunity_UserDateOfBirth", Attributes(await fixture.Service.GetById(original.Id)));
      Assert.Contains("MyOpportunity_DateCompleted", Attributes(await fixture.Service.GetById(original.Id)));
      Assert.Equal(7, fixture.Schemas.Count);
    }

    [Fact]
    public async Task HistoricalSchemaWithoutTypeRemainsReadableAndOnlyItsNewVersionGainsTheSystemClaim()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var original = Assert.Single(fixture.Schemas, schema => schema.Name == "Opportunity|Default");
      original.AttributeNames.Remove("Opportunity_Type");

      var historical = await fixture.Service.GetById(original.Id);
      Assert.DoesNotContain("Opportunity_Type", Attributes(historical));

      await fixture.Background.SeedSchemas();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();

      var latest = await fixture.Service.GetByFullName(original.Name);
      Assert.Equal(new Version(1, 1), latest.Version);
      Assert.Contains("Opportunity_Type", Attributes(latest));
      Assert.DoesNotContain("Opportunity_Type", Attributes(await fixture.Service.GetById(original.Id)));
      Assert.Equal(7, fixture.Schemas.Count);
      fixture.Provider.Verify(client => client.IssueCredential(It.IsAny<CredentialIssuanceRequest>()), Times.Never);
    }

    [Fact]
    public async Task AutomaticallyAddedSystemPropertiesDoNotCauseVersionChurn()
    {
      using var fixture = new Fixture();
      var extra = new SSISchemaEntityProperty
      {
        Id = Guid.NewGuid(),
        Name = "OrganizationName",
        NameDisplay = "Organisation",
        Description = "Issuer",
        System = true,
        SystemType = SchemaEntityPropertySystemType.Issuer,
        Required = true
      };
      fixture.Entities.Single(entity => entity.Name == "MyOpportunity").Properties!.Add(extra);

      await fixture.Background.SeedSchemas();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();

      Assert.Equal(6, fixture.Schemas.Count);
      Assert.All(await fixture.Service.List(SchemaType.Opportunity), schema =>
        Assert.Contains("MyOpportunity_OrganizationName", Attributes(schema)));
    }

    [Fact]
    public void CredentialRequirednessDoesNotChangeRequiredManualDefinitions()
    {
      using var fixture = new Fixture();
      var required = fixture.Definitions.Where(definition => definition.IsRequired).Select(definition => definition.Id).ToList();
      Assert.NotEmpty(required);

      var fields = fixture.EntityService.ListAll(SchemaType.Opportunity, true)
        .SelectMany(entity => entity.CustomFields ?? []).ToList();
      Assert.All(fields, field => Assert.False(field.Required));
      Assert.All(required, id => Assert.True(fixture.Definitions.Single(definition => definition.Id == id).IsRequired));
      Assert.All(fields, field => Assert.Equal(fixture.Definitions.Single(definition => definition.Id == field.Id).Group, field.Group));
    }

    [Theory]
    [InlineData(0, null)]
    [InlineData(1, "Email Verified")]
    [InlineData(2, "Mobile Verified (OTP)")]
    [InlineData(3, "Email Verified, Mobile Verified (OTP)")]
    [InlineData(4, "Social Login")]
    [InlineData(5, "Email Verified, Social Login")]
    [InlineData(6, "Mobile Verified (OTP), Social Login")]
    [InlineData(7, "Email Verified, Mobile Verified (OTP), Social Login")]
    public void AccountVerificationUsesConfirmedMethodsWithoutInventingIdentityAssurance(int methods, string? expected)
    {
      var user = new Domain.Entity.Models.User
      {
        Email = "youth@example.invalid",
        EmailConfirmed = (methods & 1) != 0,
        PhoneNumber = "+27123456789",
        PhoneNumberConfirmed = (methods & 2) != 0
      };

      user.SetAccountVerificationMethods((methods & 4) != 0);

      Assert.Equal((Domain.Entity.AccountVerificationMethod)methods, user.AccountVerificationMethods);
      Assert.Equal(methods, Newtonsoft.Json.Linq.JObject.Parse(JsonConvert.SerializeObject(user))
        .Value<int>(nameof(Domain.Entity.Models.User.AccountVerificationMethods)));
      var labels = user.AccountVerificationMethods.GetFlags().Select(method => method.ToDescription()).ToList();
      Assert.Equal(expected, labels.Count == 0 ? null : string.Join(", ", labels));
      Assert.Equal(expected ?? "None", user.AccountVerificationMethods.ToDescription());
      Assert.DoesNotContain("KYC", string.Join(", ", labels));
    }

    [Theory]
    [InlineData(0, "n/a")]
    [InlineData(1, "Email Verified")]
    [InlineData(2, "Mobile Verified (OTP)")]
    [InlineData(3, "Email Verified, Mobile Verified (OTP)")]
    [InlineData(4, "Social Login")]
    [InlineData(5, "Email Verified, Social Login")]
    [InlineData(6, "Mobile Verified (OTP), Social Login")]
    [InlineData(7, "Email Verified, Mobile Verified (OTP), Social Login")]
    public async Task AccountVerificationFlagsRoundTripThroughCredentialLists(int methods, string expected)
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();

      var schema = await fixture.Service.GetByFullName("YoID|Default");
      var user = new Domain.Entity.Models.User
      {
        DisplayName = "Naledi Dlamini",
        Email = "youth@example.invalid",
        EmailConfirmed = (methods & 1) != 0,
        PhoneNumber = "+27123456789",
        PhoneNumberConfirmed = (methods & 2) != 0
      };
      user.SetAccountVerificationMethods((methods & 4) != 0);
      var request = new CredentialIssuanceRequest { ArtifactType = ArtifactType.ACR, Attributes = [] };
      fixture.Map(request, schema, new Domain.Entity.Models.Organization { Name = "Yoma" });
      fixture.Map(request, schema, user);

      var detail = await fixture.ReadWalletDetail(request, schema);
      var attribute = Assert.Single(detail.Attributes, item => item.Name == "User_AccountVerificationMethods");
      Assert.Equal(expected, attribute.ValueDisplay);
      Assert.Equal("Identity", attribute.Group);
      Assert.Equal(7, attribute.SortOrder);

      var labels = user.AccountVerificationMethods.GetFlags().Select(method => method.ToDescription()).ToList();
      Assert.Equal(labels, attribute.ItemsDisplay!.Select(item => item.Name));
      if (methods == 0)
        Assert.Equal("n/a", request.Attributes[attribute.Name]);
      else
        Assert.Equal(labels, JsonConvert.DeserializeObject<List<SSICredentialAttributeItem>>(
          request.Attributes[attribute.Name])!.Select(item => item.Name));
    }

    [Fact]
    public void ConfirmationWithoutAContactDoesNotCreateACredentialClaimAndRecomputationClearsOldMethods()
    {
      var user = new Domain.Entity.Models.User { EmailConfirmed = true, PhoneNumberConfirmed = true };
      user.SetAccountVerificationMethods(false);
      Assert.Equal(Domain.Entity.AccountVerificationMethod.None, user.AccountVerificationMethods);

      user.SetAccountVerificationMethods(true);
      Assert.Equal(Domain.Entity.AccountVerificationMethod.SocialLogin, user.AccountVerificationMethods);

      user.SetAccountVerificationMethods(false);
      Assert.Equal(Domain.Entity.AccountVerificationMethod.None, user.AccountVerificationMethods);
    }

    [Fact]
    public async Task YoIDTitleAndIdentityOrderFollowTheCatalogueAndHistoricalClaimsRemainReadable()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();

      var schema = await fixture.Service.GetByFullName("YoID|Default");
      var userEntity = Assert.Single(schema.Entities, entity => entity.Name == "User");
      var title = Assert.Single(userEntity.Properties!, property => property.Name == "DisplayName");
      Assert.True(title.System);
      Assert.True(title.Required);
      Assert.Equal(SchemaEntityPropertySystemType.Title, title.SystemType);

      var user = new Domain.Entity.Models.User
      {
        Email = "youth@example.invalid",
        EmailConfirmed = true,
        FirstName = "Naledi",
        Surname = "Dlamini",
        DisplayName = "Naledi Dlamini",
        Country = "South Africa",
        Education = "Secondary",
        Gender = "Female",
        DateOfBirth = new DateTimeOffset(2003, 7, 12, 0, 0, 0, TimeSpan.Zero)
      };
      user.SetAccountVerificationMethods(true);
      var request = new CredentialIssuanceRequest { ArtifactType = ArtifactType.ACR, Attributes = [] };
      fixture.Map(request, schema, new Domain.Entity.Models.Organization { Name = "Yoma" });
      fixture.Map(request, schema, user);
      request.Attributes.Add(SSISchemaService.SchemaAttribute_Internal_DateIssued, "2026-10-11T10:00:00Z");

      var detail = await fixture.ReadWalletDetail(request, schema);
      Assert.Equal("Naledi Dlamini", detail.Title);
      Assert.Equal("Yoma", detail.Issuer);
      Assert.Null(detail.TypeContext);
      Assert.DoesNotContain(detail.Attributes, attribute => attribute.Name == "User_DisplayName");
      Assert.Equal(YoIDBodyAttributes, detail.Attributes.Select(attribute => attribute.Name));
      Assert.Equal("2003-07-12", Assert.Single(detail.Attributes, item => item.Name == "User_DateOfBirth").ValueDisplay);
      Assert.DoesNotContain("User_Email", request.Attributes.Keys);
      Assert.DoesNotContain(detail.Attributes, item => item.Name == "User_Email");
      var methods = Assert.Single(detail.Attributes, attribute => attribute.Name == "User_AccountVerificationMethods");
      Assert.Equal(EmailAndSocialVerificationMethods, methods.ItemsDisplay!.Select(item => item.Name));
      Assert.Equal("Email Verified, Social Login", methods.ValueDisplay);
      Assert.All(detail.Attributes, attribute =>
      {
        Assert.Equal("Identity", attribute.Group);
        Assert.Null(attribute.SubGroup);
      });

      // Old versions never declared the new claim. They must still parse without a replay.
      fixture.Schemas.Single(item => item.Id == schema.Id).AttributeNames.Remove("User_AccountVerificationMethods");
      request.Attributes.Remove("User_AccountVerificationMethods");
      fixture.Schemas.Single(item => item.Id == schema.Id).AttributeNames.Add("User_Email");
      request.Attributes.Add("User_Email", "historical@example.invalid");
      var historical = await fixture.ReadWalletDetail(request, schema);
      Assert.Equal("Naledi Dlamini", historical.Title);
      Assert.DoesNotContain(historical.Attributes, attribute => attribute.Name == "User_AccountVerificationMethods");
      Assert.Equal("historical@example.invalid",
        Assert.Single(historical.Attributes, item => item.Name == "User_Email").ValueDisplay);
    }

    [Theory]
    [InlineData(Domain.Opportunity.Type.Learning)]
    [InlineData(Domain.Opportunity.Type.Other)]
    [InlineData(Domain.Opportunity.Type.ImpactAction)]
    [InlineData(Domain.Opportunity.Type.Event)]
    [InlineData(Domain.Opportunity.Type.Job)]
    [InlineData(Domain.Opportunity.Type.Entrepreneurship)]
    public void SchemaAdministrationExposesBusinessCoreFieldsAndEveryApplicableCF(Domain.Opportunity.Type type)
    {
      using var fixture = new Fixture();
      var entities = fixture.EntityService.List(SchemaType.Opportunity, type.ToString());
      var opportunity = Assert.Single(entities, entity => entity.Name == "Opportunity");
      var attributes = opportunity.Properties!.Select(property => property.AttributeName).ToHashSet();
      Assert.Subset(attributes, new HashSet<string>
      {
        "Opportunity_Description", "Opportunity_Provider", "Opportunity_ProviderURL", "Opportunity_ProviderLogoURL",
        "Opportunity_ProviderCountry", "Opportunity_Categories", "Opportunity_Languages",
        "Opportunity_Countries", "Opportunity_EngagementType", "Opportunity_VerificationMethod",
        "Opportunity_Incentivized", "Opportunity_RewardType", "Opportunity_PartnerIncentiveAmount",
        "Opportunity_PartnerIncentiveCurrency", "Opportunity_ZltoReward", "Opportunity_AccessibilitySupport",
        "Opportunity_Accommodations", "Opportunity_AccommodationOtherDescription", "Opportunity_AgeFrom",
        "Opportunity_AgeTo", "Opportunity_TargetedGroups", "Opportunity_SustainableDevelopmentGoals",
        "Opportunity_DateStart", "Opportunity_DateEnd", "Opportunity_CommitmentIntervalDescription"
      });
      Assert.DoesNotContain(attributes, attribute => attribute.Contains("Coordinates") || attribute.Contains("RewardPool"));

      var fields = entities.SelectMany(entity => entity.CustomFields ?? []).ToList();
      var expected = fixture.Definitions.Where(definition => definition.IsActive
        && (definition.EntityContext == null || definition.EntityContext == type.ToString())).ToList();
      Assert.Equal(expected.Select(definition => definition.Id).Order(), fields.Select(field => field.Id).Order());
      Assert.All(fields, field =>
      {
        Assert.False(field.Required);
        Assert.Null(field.SubGroup);
      });
    }

    [Fact]
    public async Task NewlySelectableCoreFieldsUseTheExistingReflectionAndWalletMapping()
    {
      using var fixture = new Fixture();
      var entity = Assert.Single(fixture.EntityService.List(SchemaType.Opportunity), item => item.Name == "Opportunity");
      var schema = await fixture.Service.Create(new SSISchemaRequestCreate
      {
        TypeId = entity.Types!.Single(type => type.Type == SchemaType.Opportunity).Id,
        Name = "Core catalogue audit",
        ArtifactType = ArtifactType.JWS,
        Attributes = [.. entity.Properties!.Select(property => property.AttributeName)]
      });
      var request = new CredentialIssuanceRequest { ArtifactType = ArtifactType.JWS, Attributes = [] };
      fixture.Map(request, schema, new Domain.Opportunity.Models.Opportunity
      {
        Title = "Programme",
        Description = "Programme description",
        Type = Domain.Opportunity.Type.Event,
        OrganizationName = "Issuer",
        Provider = "Informational provider",
        ProviderURL = "https://example.com/provider",
        ProviderLogoURL = "https://example.com/provider-logo.png",
        ProviderCountry = "South Africa",
        Incentivized = false,
        RewardType = Domain.Opportunity.RewardType.None,
        PartnerIncentiveAmount = 10m,
        PartnerIncentiveCurrency = "USD",
        AccessibilitySupport = Domain.Opportunity.AccessibilitySupport.AvailableOnRequest,
        AccommodationOtherDescription = "Large-print material",
        AgeFrom = 18,
        AgeTo = 30,
        Accommodations = [new() { Name = "Other" }],
        TargetedGroups = [new() { Name = "Open to all" }],
        SustainableDevelopmentGoals = [new() { Name = "Quality education" }],
        ZltoReward = 20m,
        VerificationMethod = Domain.Opportunity.VerificationMethod.Manual,
        CommitmentIntervalDescription = "2 Hours",
        DateStart = new DateTimeOffset(2026, 10, 1, 0, 0, 0, TimeSpan.Zero),
        DateEnd = new DateTimeOffset(2026, 10, 31, 0, 0, 0, TimeSpan.Zero),
        Categories = [new() { Name = "Education" }],
        Languages = [new() { Name = "English" }]
      });
      request.Attributes.Add(SSISchemaService.SchemaAttribute_Internal_DateIssued, "2026-10-11T10:00:00Z");

      var detail = await fixture.ReadWalletDetail(request, schema);
      Assert.Equal("Programme", detail.Title);
      Assert.Equal("Issuer", detail.Issuer);
      Assert.Equal("Event", detail.TypeContext);
      Assert.Equal("No", Assert.Single(detail.Attributes, attribute => attribute.Name == "Opportunity_Incentivized").ValueDisplay);
      Assert.Equal("Informational provider", Assert.Single(detail.Attributes, attribute => attribute.Name == "Opportunity_Provider").ValueDisplay);
      Assert.Equal("https://example.com/provider", Assert.Single(detail.Attributes, attribute => attribute.Name == "Opportunity_ProviderURL").ValueDisplay);
      Assert.Equal("https://example.com/provider-logo.png", Assert.Single(detail.Attributes, attribute => attribute.Name == "Opportunity_ProviderLogoURL").ValueDisplay);
      Assert.Equal("South Africa", Assert.Single(detail.Attributes, attribute => attribute.Name == "Opportunity_ProviderCountry").ValueDisplay);
      Assert.Equal("2026-10-31", Assert.Single(detail.Attributes, attribute => attribute.Name == "Opportunity_DateEnd").ValueDisplay);
      Assert.Equal("Manual", Assert.Single(detail.Attributes, attribute => attribute.Name == "Opportunity_VerificationMethod").ValueDisplay);

      foreach (var name in new[] { "Categories", "Languages", "Accommodations", "TargetedGroups", "SustainableDevelopmentGoals" })
      {
        var attribute = Assert.Single(detail.Attributes, item => item.Name == $"Opportunity_{name}");
        Assert.Single(attribute.ItemsDisplay!);
        Assert.False(string.IsNullOrWhiteSpace(attribute.ValueDisplay));
      }
    }

    [Theory]
    [InlineData("User", "DisplayName")]
    [InlineData("Organization", "Name")]
    [InlineData("Opportunity", "Title")]
    [InlineData("Opportunity", "OrganizationName")]
    [InlineData("MyOpportunity", "UserDisplayName")]
    public async Task EssentialTextClaimsRejectMissingValuesForBothArtifacts(string entityName, string propertyName)
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var schema = await fixture.Service.GetByFullName(entityName is "User" or "Organization"
        ? "YoID|Default" : "Opportunity|Default");

      object entity = entityName switch
      {
        "User" => new Domain.Entity.Models.User { DisplayName = "Youth" },
        "Organization" => new Domain.Entity.Models.Organization { Name = "Yoma" },
        "Opportunity" => new Domain.Opportunity.Models.Opportunity
        {
          Title = "Opportunity",
          OrganizationName = "Issuer",
          Type = Domain.Opportunity.Type.Learning
        },
        "MyOpportunity" => new Domain.MyOpportunity.Models.MyOpportunity { UserDisplayName = "Youth" },
        _ => throw new NotSupportedException($"Entity '{entityName}' is not supported")
      };

      foreach (var artifact in Enum.GetValues<ArtifactType>())
      {
        foreach (var missing in new string?[] { null, string.Empty, "   " })
        {
          entity.GetType().GetProperty(propertyName)!.SetValue(entity, missing);
          var request = new CredentialIssuanceRequest { ArtifactType = artifact, Attributes = [] };
          var exception = Assert.Throws<TargetInvocationException>(() => fixture.Map(request, schema, entity));
          var cause = Assert.IsType<InvalidOperationException>(exception.InnerException);
          Assert.Contains($"Entity property '{propertyName}' marked as required", cause.Message);
        }
      }

      fixture.Provider.Verify(client => client.IssueCredential(It.IsAny<CredentialIssuanceRequest>()), Times.Never);
    }

    [Theory]
    [InlineData(ArtifactType.JWS, false)]
    [InlineData(ArtifactType.ACR, false)]
    [InlineData(ArtifactType.JWS, true)]
    [InlineData(ArtifactType.ACR, true)]
    public async Task LegacyDifficultyUsesCfValueOrArtifactOptionalityWithoutBlockingIssuance(ArtifactType artifact, bool supplied)
    {
      using var fixture = new Fixture();
      var schema = await fixture.Service.Create(new SSISchemaRequestCreate
      {
        TypeId = fixture.Entities.Single(entity => entity.Name == "Opportunity").Types!.Single().Id,
        Name = "Legacy Difficulty",
        ArtifactType = artifact,
        Attributes = ["Opportunity_Difficulty", "MyOpportunity_UserDisplayName"]
      });
      var key = Domain.Opportunity.CustomFieldConstants.Difficulty.Keys.Learning;
      fixture.SetDisplayValues(key, ["Resolved difficulty label"]);
      var opportunity = new Domain.Opportunity.Models.Opportunity
      {
        Title = "Opportunity",
        Type = Domain.Opportunity.Type.Learning,
        OrganizationName = "Issuer",
        CustomFields = supplied ? [new() { Key = key, ValueRaw = "Configured option key" }] : null
      };
      fixture.PopulateLegacyDifficulty(opportunity);

      var request = new CredentialIssuanceRequest { ArtifactType = artifact, Attributes = [] };
      fixture.Map(request, schema, opportunity);
      fixture.Map(request, schema, new Domain.MyOpportunity.Models.MyOpportunity { UserDisplayName = "Youth" });

      if (supplied)
        Assert.Equal("Resolved difficulty label", request.Attributes["Opportunity_Difficulty"]);
      else if (artifact == ArtifactType.ACR)
        Assert.Equal("n/a", request.Attributes["Opportunity_Difficulty"]);
      else
        Assert.DoesNotContain("Opportunity_Difficulty", request.Attributes.Keys);

      Assert.Equal("Learning", request.Attributes["Opportunity_Type"]);
      Assert.Equal("Youth", request.Attributes["MyOpportunity_UserDisplayName"]);
      Assert.False(fixture.EntityService.GetByAttributeName("Opportunity_Difficulty").Required);
    }

    [Theory]
    [InlineData("ImpactAction")]
    [InlineData("Event")]
    [InlineData("Job")]
    [InlineData("Entrepreneurship")]
    public async Task MissingCustomFieldsAreOmittedForEveryScopedJwtDefault(string context)
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var schema = await fixture.Service.GetByFullName($"Opportunity|{context}|Default");
      var request = new CredentialIssuanceRequest { ArtifactType = ArtifactType.JWS, Attributes = [] };

      fixture.Map(request, schema, new Domain.Opportunity.Models.Opportunity
      {
        Title = "A completed opportunity",
        OrganizationName = "Issuer",
        Type = Enum.Parse<Domain.Opportunity.Type>(context)
      });
      fixture.Map(request, schema, new Domain.MyOpportunity.Models.MyOpportunity { UserDisplayName = "Youth" });

      Assert.Equal(4, request.Attributes.Count);
      Assert.DoesNotContain("n/a", request.Attributes.Values);
      Assert.DoesNotContain(request.Attributes.Keys, attribute => attribute.Contains(context, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task PhoneOnlyYoIDKeepsEveryDeclaredAttributeWithExistingPlaceholders()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var schema = await fixture.Service.GetByFullName("YoID|Default");
      var request = new CredentialIssuanceRequest { ArtifactType = ArtifactType.ACR, Attributes = [] };

      fixture.Map(request, schema, new Domain.Entity.Models.Organization { Name = "Yoma" });
      fixture.Map(request, schema, new Domain.Entity.Models.User { DisplayName = "Youth", PhoneNumber = "+27123456789" });

      Assert.Equal(Attributes(schema).Order(), request.Attributes.Keys.Order());
      Assert.DoesNotContain("User_Email", request.Attributes.Keys);
      Assert.Equal("n/a", request.Attributes["User_Education"]);
      Assert.Equal("n/a", request.Attributes["User_AccountVerificationMethods"]);
      Assert.DoesNotContain("User_PhoneNumber", request.Attributes.Keys);
    }

    [Fact]
    public async Task LocationsEvidenceAndParticipationUseRecordedValuesWithoutSensitiveArtifacts()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var schema = await fixture.Service.GetByFullName("Opportunity|Event|Default");
      var request = new CredentialIssuanceRequest { ArtifactType = ArtifactType.JWS, Attributes = [] };
      fixture.Map(request, schema, new Domain.Opportunity.Models.Opportunity
      {
        Title = "Event",
        OrganizationName = "Issuer",
        Type = Domain.Opportunity.Type.Event,
        CommitmentInterval = TimeIntervalOption.Day,
        CommitmentIntervalCount = 9,
        VerificationMethod = Domain.Opportunity.VerificationMethod.Manual,
        Countries =
        [
          new() { Name = "South Africa", Region = "Western Cape", City = "Cape Town", Coordinates = [18.4, -33.9] },
          new() { Name = "Worldwide" }
        ]
      });
      fixture.Map(request, schema, new Domain.MyOpportunity.Models.MyOpportunity
      {
        UserDisplayName = "Youth",
        CommitmentInterval = TimeIntervalOption.Hour,
        CommitmentIntervalCount = 2,
        CommentVerification = "Approved after reviewing the uploads",
        CountryId = Guid.NewGuid(),
        Country = "South Africa",
        Region = "Western Cape",
        City = "Cape Town",
        Verifications =
        [
          new() { VerificationType = Domain.Opportunity.VerificationType.Picture, FileURL = "https://private.example/photo" },
          new() { VerificationType = Domain.Opportunity.VerificationType.Picture },
          new() { VerificationType = Domain.Opportunity.VerificationType.FileUpload }
        ]
      });

      Assert.Equal("Cape Town, Western Cape, South Africa", request.Attributes["MyOpportunity_Location"]);
      Assert.DoesNotContain("Opportunity_Countries", request.Attributes.Keys);
      Assert.Equal("2 Hours", request.Attributes["MyOpportunity_CommitmentIntervalDescription"]);
      Assert.Equal("Manual", request.Attributes["Opportunity_VerificationMethod"]);
      Assert.Equal("Picture, File Upload", request.Attributes["MyOpportunity_VerificationEvidence"]);
      Assert.DoesNotContain("Approved after reviewing the uploads", request.Attributes.Values);
      Assert.DoesNotContain("private.example", JsonConvert.SerializeObject(request.Attributes));
      Assert.DoesNotContain("18.4", JsonConvert.SerializeObject(request.Attributes));
      Assert.DoesNotContain("LocationDisplayName", JsonConvert.SerializeObject(new Domain.Opportunity.Models.OpportunityCountryInfo()));
    }

    [Theory]
    [InlineData(Domain.Opportunity.Type.Learning)]
    [InlineData(Domain.Opportunity.Type.Other)]
    [InlineData(Domain.Opportunity.Type.Event)]
    [InlineData(Domain.Opportunity.Type.ImpactAction)]
    [InlineData(Domain.Opportunity.Type.Job)]
    public async Task MissingParticipationSnapshotOmitsLocationWithoutFallingBackToOpportunity(Domain.Opportunity.Type type)
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var schema = await fixture.Service.GetByFullName(SSISSchemaHelper.ToDefaultFullName(type));
      var request = new CredentialIssuanceRequest { ArtifactType = ArtifactType.JWS, Attributes = [] };
      fixture.Map(request, schema, new Domain.Opportunity.Models.Opportunity
      {
        Title = "Historical completion",
        OrganizationName = "Issuer",
        Type = type,
        EngagementType = EngagementTypeOption.OnSite,
        Countries = [new() { Name = "South Africa", City = "Advertised City" }]
      });
      fixture.Map(request, schema, new Domain.MyOpportunity.Models.MyOpportunity
      {
        UserDisplayName = "Youth",
        UserCountry = "South Africa"
      });
      Assert.DoesNotContain("MyOpportunity_Location", request.Attributes.Keys);
      Assert.DoesNotContain("Opportunity_Countries", request.Attributes.Keys);
      Assert.DoesNotContain("Advertised City", JsonConvert.SerializeObject(request.Attributes));
    }

    [Fact]
    public async Task HistoricalAvailabilityLocationRemainsSelectableAndReadable()
    {
      using var fixture = new Fixture();
      var schema = await fixture.Service.Create(new SSISchemaRequestCreate
      {
        TypeId = fixture.Entities.Single(entity => entity.Name == "Opportunity").Types!.Single().Id,
        Name = "Historical availability location",
        ArtifactType = ArtifactType.JWS,
        Attributes = ["Opportunity_Countries"]
      });
      var request = new CredentialIssuanceRequest { ArtifactType = ArtifactType.JWS, Attributes = [] };
      fixture.Map(request, schema, new Domain.Opportunity.Models.Opportunity
      {
        Title = "Historical credential",
        OrganizationName = "Issuer",
        Type = Domain.Opportunity.Type.Learning,
        Countries = [new() { Name = "South Africa" }, new() { Name = "Worldwide" }]
      });
      request.Attributes.Add(SSISchemaService.SchemaAttribute_Internal_DateIssued, "2026-10-11T10:00:00Z");
      var detail = await fixture.ReadWalletDetail(request, schema);
      var location = Assert.Single(detail.Attributes, attribute => attribute.Name == "Opportunity_Countries");
      Assert.Equal(2, location.ItemsDisplay!.Count);
      Assert.Contains(location.ItemsDisplay, item => item.Name == "Worldwide");
    }

    [Theory]
    [InlineData(Domain.Opportunity.Type.Learning, "Auto-verification: Action Link")]
    [InlineData(Domain.Opportunity.Type.Other, "Auto-verification: CSV Import")]
    [InlineData(Domain.Opportunity.Type.Event, "Auto-verification: Partner Sync")]
    [InlineData(Domain.Opportunity.Type.ImpactAction, "Auto-verification: Action Link")]
    [InlineData(Domain.Opportunity.Type.Job, "Imported placement confirmed by partner")]
    [InlineData(Domain.Opportunity.Type.Entrepreneurship, "Auto-verification: CSV Import")]
    public async Task VerificationEvidenceFallsBackToRecordedCommentWithoutInferringConfiguredMethod(
      Domain.Opportunity.Type type, string comment)
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var schema = await fixture.Service.GetByFullName(SSISSchemaHelper.ToDefaultFullName(type));

      foreach (var method in Enum.GetValues<Domain.Opportunity.VerificationMethod>())
      {
        var request = new CredentialIssuanceRequest { ArtifactType = ArtifactType.JWS, Attributes = [] };
        fixture.Map(request, schema, new Domain.Opportunity.Models.Opportunity
        {
          Title = "Completed opportunity",
          OrganizationName = "Issuer",
          Type = type,
          VerificationMethod = method
        });
        fixture.Map(request, schema, new Domain.MyOpportunity.Models.MyOpportunity
        {
          UserDisplayName = "Youth",
          CommentVerification = comment,
          Verifications = []
        });

        Assert.Equal(method.ToString(), request.Attributes["Opportunity_VerificationMethod"]);
        Assert.Equal(comment, request.Attributes["MyOpportunity_VerificationEvidence"]);
        var detail = await fixture.ReadWalletDetail(request, schema);
        var methodAttribute = Assert.Single(detail.Attributes, item => item.Name == "Opportunity_VerificationMethod");
        var evidenceAttribute = Assert.Single(detail.Attributes, item => item.Name == "MyOpportunity_VerificationEvidence");
        Assert.Equal("Verification Method", methodAttribute.NameDisplay);
        Assert.Equal("Verification Evidence", evidenceAttribute.NameDisplay);
        Assert.Equal(comment, evidenceAttribute.ValueDisplay);
        Assert.True(methodAttribute.SortOrder < evidenceAttribute.SortOrder);
        Assert.Equal(["User", "Verification Method", "Verification Evidence"],
          detail.Attributes.Where(attribute => attribute.Group == "Completion Details")
            .Select(attribute => attribute.NameDisplay));
      }
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void MissingVerificationEvidenceIsNotInvented(string? comment)
    {
      var item = new Domain.MyOpportunity.Models.MyOpportunity { CommentVerification = comment };

      Assert.Null(item.VerificationEvidence);
      item.Verifications = [];
      Assert.Null(item.VerificationEvidence);
      Assert.DoesNotContain("VerificationEvidence", JsonConvert.SerializeObject(item));
    }

    [Fact]
    public async Task DisabledEnvironmentAndContendedLockDoNotWriteProviderSchemas()
    {
      using var fixture = new Fixture();
      fixture.Settings.SSIEnabledEnvironments = "Production";
      await fixture.Background.SeedSchemas();
      fixture.Settings.SSIEnabledEnvironments = "Local";
      fixture.Lock.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>()))
        .ReturnsAsync(false);
      await fixture.Background.SeedSchemas();

      Assert.Empty(fixture.Schemas);
      fixture.Provider.Verify(client => client.UpsertSchema(It.IsAny<SchemaRequest>()), Times.Never);
      fixture.Lock.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task ProviderFailureReleasesLockAndRetryDoesNotRepublishSuccessfulSchemas()
    {
      using var fixture = new Fixture();
      fixture.Provider.Setup(client => client.UpsertSchema(It.Is<SchemaRequest>(request => request.Name == "Opportunity|Job|Default")))
        .ThrowsAsync(new InvalidOperationException("Simulated provider outage"));

      await fixture.Background.SeedSchemas();
      Assert.Equal(3, fixture.Schemas.Count);
      Assert.Single(fixture.Errors);
      fixture.Lock.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);

      fixture.RestoreProviderWrites();
      await fixture.Background.SeedSchemas();
      Assert.Equal(6, fixture.Schemas.Count);
      Assert.Single(fixture.Errors);
      Assert.All(fixture.Schemas, schema => Assert.Equal(new Version(1, 0), schema.Version));
      fixture.Lock.Verify(service => service.ReleaseLockAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Exactly(2));
    }

    [Fact]
    public async Task FalseZeroAndConfiguredMultiSelectLabelsAreNotTreatedAsMissing()
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var schema = await fixture.Service.GetByFullName("Opportunity|Entrepreneurship|Default");
      var request = new CredentialIssuanceRequest { ArtifactType = ArtifactType.JWS, Attributes = [] };
      fixture.SetDisplayValues("EntrepreneurshipFundingTypes", ["Grants, donations", "Bootstrapping"]);
      fixture.Map(request, schema, new Domain.MyOpportunity.Models.MyOpportunity
      {
        UserDisplayName = "Youth",
        CustomFields =
        [
          new() { Key = "EntrepreneurshipBusinessRegistered", ValueRaw = "False" },
          new() { Key = "EntrepreneurshipJobsCreated", ValueRaw = "0" },
          new() { Key = "EntrepreneurshipFundingTypes", ValueRaw = "Grant,Bootstrapping" }
        ]
      });

      Assert.Equal("False", request.Attributes["MyOpportunity_EntrepreneurshipBusinessRegistered"]);
      Assert.Equal("0", request.Attributes["MyOpportunity_EntrepreneurshipJobsCreated"]);
      var funding = JsonConvert.DeserializeObject<List<SSICredentialAttributeItem>>(
        request.Attributes["MyOpportunity_EntrepreneurshipFundingTypes"])!;
      Assert.Equal(FundingDisplayValues, funding.Select(item => item.Name));
    }

    [Theory]
    [InlineData(Domain.Opportunity.Type.Other)]
    [InlineData(Domain.Opportunity.Type.Learning)]
    [InlineData(Domain.Opportunity.Type.ImpactAction)]
    [InlineData(Domain.Opportunity.Type.Event)]
    [InlineData(Domain.Opportunity.Type.Job)]
    [InlineData(Domain.Opportunity.Type.Entrepreneurship)]
    public async Task EveryConfiguredOpportunityClaimRoundTripsIntoGroupedWalletDetail(Domain.Opportunity.Type type)
    {
      using var fixture = new Fixture();
      await fixture.Background.SeedSchemas();
      fixture.AssertNoErrors();
      var schema = await fixture.Service.GetByFullName(SSISSchemaHelper.ToDefaultFullName(type));
      var request = new CredentialIssuanceRequest
      {
        SchemaId = schema.Id,
        SchemaName = schema.Name,
        ArtifactType = ArtifactType.JWS,
        Attributes = []
      };
      var fields = schema.Entities.SelectMany(entity => entity.CustomFields ?? []).ToList();

      // Exercise the selected catalogue, not every configured capture field. The real resolver's
      // display contract is represented here; lookup and option resolution have their own tests.
      foreach (var field in fields)
      {
        var value = field.DataType switch
        {
          CustomFieldDataType.String => "Reported outcome — café",
          CustomFieldDataType.Integer => "0",
          CustomFieldDataType.Decimal => "1000.50",
          CustomFieldDataType.Boolean => "False",
          CustomFieldDataType.Date => "2026-10-09",
          CustomFieldDataType.DateTime => "2026-10-09T10:00:00Z",
          CustomFieldDataType.Option => "Resolved option / lookup label",
          _ => throw new NotSupportedException($"Fixture data type '{field.DataType}' is not supported")
        };
        fixture.SetDisplayValues(field.Key, field.SupportsMultiple == true
          ? ["First label, with a comma", "Second label — café"] : [value]);
      }

      fixture.Map(request, schema, new Domain.Opportunity.Models.Opportunity
      {
        Title = "Completed opportunity",
        Summary = "Programme summary, not a venture outcome",
        Type = type,
        OrganizationName = "Issuer",
        OrganizationLogoURL = "https://example.invalid/issuer.png",
        VerificationMethod = Domain.Opportunity.VerificationMethod.Manual,
        EngagementType = EngagementTypeOption.OnSite,
        Countries = [new() { Name = "South Africa", Region = "Western Cape", City = "Cape Town" }],
        Skills = [new() { Name = "Skill, with a comma" }],
        CustomFields = schema.Entities.Single(entity => entity.Name == "Opportunity").CustomFields?
          .Select(field => new CustomFieldValueItem { Key = field.Key, ValueRaw = "supplied" }).ToList()
      });
      fixture.Map(request, schema, new Domain.MyOpportunity.Models.MyOpportunity
      {
        UserDisplayName = "Youth",
        CommitmentInterval = TimeIntervalOption.Hour,
        CommitmentIntervalCount = 2,
        Verifications = [new() { VerificationType = Domain.Opportunity.VerificationType.Picture }],
        OpportunityType = type,
        CountryId = Guid.NewGuid(),
        Country = "South Africa",
        Region = "Western Cape",
        City = "Cape Town",
        CustomFields = schema.Entities.Single(entity => entity.Name == "MyOpportunity").CustomFields?
          .Select(field => new CustomFieldValueItem { Key = field.Key, ValueRaw = "supplied" }).ToList()
      });

      Assert.Equal(Attributes(schema).Order(), request.Attributes.Keys.Order());
      request.Attributes.Add(SSISchemaService.SchemaAttribute_Internal_DateIssued, "2026-10-09T10:00:00Z");
      var detail = await fixture.ReadWalletDetail(request, schema);

      Assert.Equal(type.ToString(), detail.TypeContext);
      Assert.Equal("Completed opportunity", detail.Title);
      Assert.Equal("Issuer", detail.Issuer);
      Assert.Equal(new DateTimeOffset(2026, 10, 9, 10, 0, 0, TimeSpan.Zero), detail.DateIssued);
      Assert.DoesNotContain(detail.Attributes, attribute => attribute.Name == "Opportunity_Type");
      Assert.All(detail.Attributes, attribute => Assert.Null(attribute.SubGroup));
      Assert.Equal(schema.Entities.SelectMany(entity => entity.Properties?.Where(property => !property.System) ?? [])
        .Select(property => property.AttributeName).Concat(fields.Select(field => field.AttributeName)).Order(),
        detail.Attributes.Select(attribute => attribute.Name).Order());

      var location = Assert.Single(detail.Attributes, attribute => attribute.Name == "MyOpportunity_Location");
      Assert.Equal("Location", location.NameDisplay);
      Assert.Equal("Completion Details", location.Group);
      Assert.Equal("Cape Town, Western Cape, South Africa", location.ValueDisplay);
      var engagement = Assert.Single(detail.Attributes, attribute => attribute.Name == "Opportunity_EngagementType");
      Assert.Equal("Engagement", engagement.NameDisplay);
      Assert.Equal("On-site", engagement.ValueDisplay);

      // Assert the approved displayed sequence independently of the seeded sort metadata.
      var completionNames = new List<string> { "MyOpportunity_UserDisplayName" };
      if (type != Domain.Opportunity.Type.Job) completionNames.Add("Opportunity_Skills");
      string[] typeSpecificNames = type switch
      {
        Domain.Opportunity.Type.Learning or Domain.Opportunity.Type.Other => [],
        Domain.Opportunity.Type.ImpactAction =>
          ["Opportunity_ImpactActionVerifiedActivityType", "MyOpportunity_ImpactActionImpactAchieved"],
        Domain.Opportunity.Type.Event => ["MyOpportunity_EventRole"],
        Domain.Opportunity.Type.Job => ["MyOpportunity_JobEmploymentStartDate"],
        Domain.Opportunity.Type.Entrepreneurship =>
        [
          "MyOpportunity_EntrepreneurshipBusinessName", "MyOpportunity_EntrepreneurshipBusinessSummary",
          "MyOpportunity_EntrepreneurshipBusinessRegistered", "MyOpportunity_EntrepreneurshipRegistrationReference",
          "MyOpportunity_EntrepreneurshipSector", "MyOpportunity_EntrepreneurshipJobsCreated",
          "MyOpportunity_EntrepreneurshipRevenueBand", "MyOpportunity_EntrepreneurshipRevenueCurrency",
          "MyOpportunity_EntrepreneurshipFundingTypes", "MyOpportunity_EntrepreneurshipFundingAmountBand",
          "MyOpportunity_EntrepreneurshipFunder", "MyOpportunity_EntrepreneurshipCustomerReach"
        ],
        _ => throw new NotSupportedException($"Opportunity type '{type}' is not supported")
      };
      completionNames.AddRange(typeSpecificNames);
      completionNames.AddRange(
      [
        "MyOpportunity_Location", "MyOpportunity_CommitmentIntervalDescription",
        "Opportunity_VerificationMethod", "MyOpportunity_VerificationEvidence"
      ]);
      Assert.Equal(completionNames, detail.Attributes
        .Where(attribute => attribute.Group == "Completion Details").Select(attribute => attribute.Name));
      Assert.Equal("User", Assert.Single(detail.Attributes, attribute => attribute.Name == "MyOpportunity_UserDisplayName").NameDisplay);
      Assert.Equal("Duration", Assert.Single(detail.Attributes, attribute => attribute.Name == "MyOpportunity_CommitmentIntervalDescription").NameDisplay);

      foreach (var field in fields)
      {
        var attribute = Assert.Single(detail.Attributes, attribute => attribute.Name == field.AttributeName);
        Assert.Equal(field.NameDisplay, attribute.NameDisplay);
        Assert.Equal(field.Group, attribute.Group);
        Assert.Equal(field.SortOrder, attribute.SortOrder);
        if (field.SupportsMultiple == true)
          Assert.Equal(MultiValueDisplayValues, attribute.ItemsDisplay!.Select(item => item.Name));
        else if (field.DataType == CustomFieldDataType.Boolean)
          Assert.Equal("No", attribute.ValueDisplay);
        else if (field.DataType == CustomFieldDataType.Integer)
          Assert.Equal("0", attribute.ValueDisplay);
        else
          Assert.False(string.IsNullOrWhiteSpace(attribute.ValueDisplay));
      }

      if (type == Domain.Opportunity.Type.Job)
        Assert.DoesNotContain(detail.Attributes, attribute => attribute.Name.Contains("Skills", StringComparison.Ordinal));
      else
      {
        var skills = Assert.Single(detail.Attributes, attribute => attribute.Name == "Opportunity_Skills");
        Assert.Equal("Skill, with a comma", Assert.Single(skills.ItemsDisplay!).Name);
      }

      var groups = detail.Attributes.GroupBy(attribute => attribute.Group).ToList();
      Assert.Equal("Opportunity Details", groups[0].Key);
      Assert.Equal("Completion Details", groups[1].Key);
      Assert.Equal(groups.Skip(2).Select(group => group.Key)
        .OrderBy(group => string.IsNullOrEmpty(group) ? 1 : 0)
        .ThenBy(group => group), groups.Skip(2).Select(group => group.Key));
      Assert.Equal(groups.SelectMany(group => group.Select(attribute => attribute.Name)),
        detail.Attributes.Select(attribute => attribute.Name));
      Assert.All(groups, group => Assert.Equal(group.Select(attribute => attribute.SortOrder)
        .OrderBy(order => order ?? int.MaxValue),
        group.Select(attribute => attribute.SortOrder)));
    }
    #endregion Tests

    #region Private Members
    private static HashSet<string> Attributes(SSISchema schema)
    {
      return [.. schema.Entities
        .SelectMany(entity => (entity.Properties?.Select(property => property.AttributeName) ?? [])
          .Concat(entity.CustomFields?.Select(field => field.AttributeName) ?? []))];
    }

    private sealed class Fixture : IDisposable
    {
      private readonly MemoryCache _cache = new(new MemoryCacheOptions());
      private readonly Mock<ILogger<SSIBackgroundService>> _logger = new();
      private readonly Mock<ICustomFieldDefinitionService> _definitionService = new();
      private readonly Mock<ICustomFieldValueService> _valueService = new();

      public AppSettings Settings { get; } = new()
      {
        SSIEnabledEnvironments = "Local",
        SSISchemaFullNameYoID = "YoID|Default",
        CacheEnabledByCacheItemTypes = "None"
      };

      public List<Schema> Schemas { get; } = [];
      public List<SSISchemaEntity> Entities { get; }
      public List<CustomFieldDefinition> Definitions { get; }
      public Mock<ISSIProviderClient> Provider { get; } = new();
      public Mock<IDistributedLockService> Lock { get; } = new();
      public SSISchemaEntityService EntityService { get; }
      public SSISchemaService Service { get; }
      public SSIBackgroundService Background { get; }

      public List<Moq.IInvocation> Errors => [.. _logger.Invocations.Where(invocation => invocation.Method.Name == "Log" && invocation.Arguments[0] is LogLevel.Error)];

      public Fixture()
      {
        _logger.Setup(logger => logger.IsEnabled(It.IsAny<LogLevel>())).Returns(true);

        Definitions = CustomFieldFixtureData.CreateDefinitions();
        Entities = SchemaFixtureData.CreateEntities();
        var schemaTypes = Entities.SelectMany(entity => entity.Types!).DistinctBy(type => type.Id).ToList();
        var typeService = new Mock<ISSISchemaTypeService>();
        typeService.Setup(service => service.GetByName(It.IsAny<string>()))
          .Returns((string name) => schemaTypes.Single(type => type.Name == name));
        typeService.Setup(service => service.GetByNameOrNull(It.IsAny<string>()))
          .Returns((string name) => schemaTypes.SingleOrDefault(type => type.Name == name));
        typeService.Setup(service => service.GetById(It.IsAny<Guid>()))
          .Returns((Guid id) => schemaTypes.Single(type => type.Id == id));
        typeService.Setup(service => service.GetByIdOrNull(It.IsAny<Guid>()))
          .Returns((Guid id) => schemaTypes.SingleOrDefault(type => type.Id == id));

        var repository = new Mock<IRepositoryWithNavigation<SSISchemaEntity>>();
        repository.Setup(repo => repo.Query(true)).Returns(() => Entities.AsQueryable());
        var opportunityTypes = new Mock<IOpportunityTypeService>();
        opportunityTypes.Setup(service => service.GetByNameOrNull(It.IsAny<string>()))
          .Returns((string name) => Enum.TryParse<Domain.Opportunity.Type>(name, out _)
            ? new Domain.Opportunity.Models.Lookups.OpportunityType { Name = name } : null);
        _definitionService.Setup(service => service.List(It.IsAny<CustomFieldEntityType>(), false, true, It.IsAny<string?>()))
          .Returns((CustomFieldEntityType entity, bool _, bool _, string? context) => [.. Definitions
            .Where(definition => definition.EntityType == entity.ToString() && definition.IsActive &&
              (definition.EntityContext == null || definition.EntityContext == context))]);
        _definitionService.Setup(service => service.ListAll(It.IsAny<CustomFieldEntityType>(), false, It.IsAny<bool>()))
          .Returns((CustomFieldEntityType entity, bool _, bool active) => [.. Definitions.Where(definition => definition.EntityType == entity.ToString() && (!active || definition.IsActive))]);
        _definitionService.Setup(service => service.GetByKey(It.IsAny<CustomFieldEntityType>(), It.IsAny<string>(), true, false))
          .Returns((CustomFieldEntityType entity, string key, bool _, bool _) => Definitions
            .Single(definition => definition.EntityType == entity.ToString() && definition.Key == key));
        _definitionService.Setup(service => service.MarkSchemaMapped(It.IsAny<List<Guid>>())).Returns(Task.CompletedTask);
        _valueService.Setup(service => service.ResolveDisplayValues(It.IsAny<CustomFieldDefinition>(), It.IsAny<CustomFieldValueItem>()))
          .Returns((CustomFieldDefinition _, CustomFieldValueItem value) => value.ValueRaw == null ? [] : [value.ValueRaw]);

        EntityService = new SSISchemaEntityService(Options.Create(Settings), _cache, typeService.Object,
          repository.Object, _definitionService.Object, opportunityTypes.Object);
        var factory = new Mock<ISSIProviderClientFactory>();
        factory.Setup(provider => provider.CreateClient()).Returns(Provider.Object);
        Provider.Setup(provider => provider.ListSchemas(It.IsAny<bool>())).ReturnsAsync(() => [.. Schemas]);
        RestoreProviderWrites();
        Service = new SSISchemaService(Options.Create(Settings), _cache, factory.Object, EntityService,
          _definitionService.Object, typeService.Object, new SchemaRequestValidatorCreate(EntityService, typeService.Object),
          new SchemaRequestValidatorUpdate(EntityService));
        var environment = new Mock<IEnvironmentProvider>();
        environment.SetupGet(provider => provider.Environment).Returns(Domain.Core.Environment.Local);
        Lock.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>())).ReturnsAsync(true);
        Background = new SSIBackgroundService(_logger.Object, Options.Create(Settings), environment.Object,
          Options.Create(new ScheduleJobOptions()), Mock.Of<IServiceScopeFactory>(), Service, EntityService,
          Mock.Of<ISSITenantService>(), Mock.Of<ISSICredentialService>(), Lock.Object,
          Mock.Of<Microsoft.Extensions.Hosting.IHostApplicationLifetime>());
      }

      public void Map<T>(CredentialIssuanceRequest request, SSISchema schema, T entity) where T : class
      {
        var type = entity.GetType();
        var schemaEntity = schema.Entities.Single(item => item.Name == type.Name);
        var method = typeof(SSIBackgroundService).GetMethod("ReflectEntityValues", BindingFlags.Static | BindingFlags.NonPublic)!;
        method.MakeGenericMethod(type).Invoke(null,
          [request, schemaEntity, type, entity, _definitionService.Object, _valueService.Object]);
      }

      public void PopulateLegacyDifficulty(Domain.Opportunity.Models.Opportunity opportunity)
      {
        var method = typeof(SSIBackgroundService).GetMethod("ResolveLegacyDifficulty", BindingFlags.Static | BindingFlags.NonPublic)!;
        var value = method.Invoke(null, [opportunity, _definitionService.Object, _valueService.Object]);
        typeof(Domain.Opportunity.Models.Opportunity).GetProperty("Difficulty")!.SetValue(opportunity, value);
      }

      public void AssertNoErrors()
      {
        Assert.Empty(Errors);
      }

      public void RestoreProviderWrites()
      {
        Provider.Setup(provider => provider.UpsertSchema(It.IsAny<SchemaRequest>()))
          .ReturnsAsync((SchemaRequest request) =>
          {
            var existing = Schemas.Where(schema => schema.Name == request.Name)
              .OrderByDescending(schema => schema.Version).FirstOrDefault();
            var version = existing == null
              ? new Version(1, 0) : new Version(existing.Version.Major, existing.Version.Minor + 1);
            var schema = new Schema
            {
              Id = $"test:2:{request.Name}:{version}",
              Name = request.Name,
              Version = version,
              ArtifactType = request.ArtifactType,
              AttributeNames = [.. request.Attributes]
            };
            Schemas.Add(schema);
            return schema;
          });
      }

      public void SetDisplayValues(string key, List<string> values)
      {
        _valueService.Setup(service => service.ResolveDisplayValues(
          It.Is<CustomFieldDefinition>(definition => definition.Key == key), It.IsAny<CustomFieldValueItem>()))
          .Returns(values);
      }

      public async Task<SSICredential> ReadWalletDetail(CredentialIssuanceRequest request, SSISchema schema)
      {
        var user = new Domain.Entity.Models.User { Id = Guid.NewGuid(), Username = "wallet-test" };
        var users = new Mock<IUserService>();
        users.Setup(service => service.GetByUsername(user.Username, false, false)).Returns(user);
        var tenants = new Mock<ISSITenantService>();
        tenants.Setup(service => service.GetTenantId(Domain.Entity.EntityType.User, user.Id)).Returns("holder");
        var httpContext = new HttpContextAccessor
        {
          HttpContext = new DefaultHttpContext
          {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, user.Username)], "Test"))
          }
        };
        var credential = new Credential { Id = "mapped-credential", SchemaId = schema.Id, Attributes = request.Attributes };
        Provider.Setup(client => client.GetCredentialById("holder", credential.Id)).ReturnsAsync(credential);
        var factory = new Mock<ISSIProviderClientFactory>();
        factory.Setup(provider => provider.CreateClient()).Returns(Provider.Object);
        var wallet = new SSIWalletService(httpContext, users.Object, factory.Object, tenants.Object,
          Service, new SSIWalletSearchFilterValidator());

        return await wallet.GetUserCredentialById(credential.Id);
      }

      public void Dispose() => _cache.Dispose();

    }
    #endregion Private Members
  }
}
