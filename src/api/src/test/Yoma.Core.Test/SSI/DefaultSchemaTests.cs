using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using System.Reflection;
using System.Security.Claims;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
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
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.SSI
{
  public class DefaultSchemaTests
  {
    #region Tests
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
        status.Object, repository.Object);

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
    public void SeededCorePropertiesFitStorageAndDoNotReplaceHistoricalMappings()
    {
      using var fixture = new Fixture();
      var properties = fixture.Entities.SelectMany(entity => entity.Properties!).ToList();

      Assert.Equal(properties.Count, properties.Select(property => property.Id).Distinct().Count());
      Assert.All(properties, property =>
      {
        Assert.InRange(property.Name.Length, 1, 50);
        Assert.InRange(property.NameDisplay.Length, 1, 50);
        Assert.InRange(property.Description.Length, 1, 125);
        Assert.True(property.Group == null || property.Group.Length <= 100);
        Assert.True(property.SubGroup == null || property.SubGroup.Length <= 100);
      });
      Assert.All(fixture.Entities, entity =>
        Assert.Equal(entity.Properties!.Count, entity.Properties.Select(property => property.Name).Distinct().Count()));

      var opportunity = Assert.Single(fixture.Entities, entity => entity.Name == "Opportunity");
      var participation = Assert.Single(fixture.Entities, entity => entity.Name == "MyOpportunity");
      Assert.Contains(opportunity.Properties!, property => property.Name == "Difficulty");
      Assert.Contains(participation.Properties!, property => property.Name == "UserDateOfBirth");
      Assert.Contains(participation.Properties!, property => property.Name == "DateCompleted");
    }

    [Fact]
    public void CredentialTypeAliasesMatchTheConfiguredHistoricalLookupRename()
    {
      var initial = Assert.Single(new ApplicationDb_Initial().UpOperations.OfType<InsertDataOperation>(),
        operation => operation.Schema == "Opportunity" && operation.Table == "OpportunityType");
      var renamed = new ApplicationDb_CF_Configuration().UpOperations.OfType<UpdateDataOperation>()
        .Where(operation => operation.Schema == "Opportunity" && operation.Table == "OpportunityType"
          && operation.Columns.Contains("Name"));

      Assert.NotEmpty(renamed);
      foreach (var operation in renamed)
      {
        var id = operation.KeyValues[0, Array.IndexOf(operation.KeyColumns, "Id")]!.ToString();
        var originalRow = Assert.Single(Enumerable.Range(0, initial.Values.GetLength(0)),
          row => initial.Values[row, Array.IndexOf(initial.Columns, "Id")]!.ToString() == id);
        var historicalName = initial.Values[originalRow, Array.IndexOf(initial.Columns, "Name")]!.ToString();
        var currentName = operation.Values[0, Array.IndexOf(operation.Columns, "Name")]!.ToString();

        Assert.Equal(currentName, SSICredentialOpportunityTypeMapper.ParseOrNull(historicalName)?.ToString());
      }
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
        Assert.Contains("Opportunity_Countries", attributes);
        Assert.Contains("Opportunity_EngagementType", attributes);
        Assert.Contains("MyOpportunity_CommitmentIntervalDescription", attributes);
        Assert.Contains("MyOpportunity_Verifications", attributes);
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
      fixture.Schemas.ForEach(schema => schema.AttributeNames = schema.AttributeNames.Reverse().ToList());

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

    [Fact]
    public void OnlyEssentialCoreClaimsAreRequiredByTheMigratedCatalogue()
    {
      using var fixture = new Fixture();
      var entities = fixture.EntityService.ListAll(null, false);
      var required = entities.SelectMany(entity => entity.Properties ?? [])
        .Where(property => property.Required)
        .Select(property => property.AttributeName)
        .Order()
        .ToList();

      Assert.Equal(new[]
      {
        "User_DisplayName",
        "Organization_Name",
        "Opportunity_Title",
        "Opportunity_Type",
        "Opportunity_OrganizationName",
        "MyOpportunity_UserDisplayName"
      }.Order(), required);
      Assert.All(entities.SelectMany(entity => entity.CustomFields ?? []), field => Assert.False(field.Required));

      var opportunity = Assert.Single(entities, entity => entity.Name == "Opportunity");
      var difficulty = Assert.Single(opportunity.Properties!, property => property.Name == "Difficulty");
      Assert.Equal(Guid.Parse("FF423D0C-2E91-48A6-9245-28EEF6E96B01"), difficulty.Id);
      Assert.False(difficulty.Required);
      Assert.False(difficulty.System);
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
      Assert.Equal("n/a", request.Attributes["User_Email"]);
      Assert.Equal("n/a", request.Attributes["User_Education"]);
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
        Verifications =
        [
          new() { VerificationType = Domain.Opportunity.VerificationType.Picture, FileURL = "https://private.example/photo" },
          new() { VerificationType = Domain.Opportunity.VerificationType.Picture },
          new() { VerificationType = Domain.Opportunity.VerificationType.FileUpload }
        ]
      });

      var locations = JsonConvert.DeserializeObject<List<SSICredentialAttributeItem>>(request.Attributes["Opportunity_Countries"])!;
      Assert.Equal(new[] { "Cape Town, Western Cape, South Africa", "Worldwide" }, locations.Select(item => item.Name));
      Assert.Equal("2 Hours", request.Attributes["MyOpportunity_CommitmentIntervalDescription"]);
      var evidence = JsonConvert.DeserializeObject<List<SSICredentialAttributeItem>>(request.Attributes["MyOpportunity_Verifications"])!;
      Assert.Equal(new[] { "Picture", "File Upload" }, evidence.Select(item => item.Name));
      Assert.DoesNotContain("private.example", JsonConvert.SerializeObject(request.Attributes));
      Assert.DoesNotContain("18.4", JsonConvert.SerializeObject(request.Attributes));
      Assert.DoesNotContain("LocationDisplayName", JsonConvert.SerializeObject(new Domain.Opportunity.Models.OpportunityCountryInfo()));
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
      fixture.SetDisplayValues("entrepreneurshipFundingTypes", ["Grants, donations", "Bootstrapping"]);
      fixture.Map(request, schema, new Domain.MyOpportunity.Models.MyOpportunity
      {
        UserDisplayName = "Youth",
        CustomFields =
        [
          new() { Key = "entrepreneurshipBusinessRegistered", ValueRaw = "False" },
          new() { Key = "entrepreneurshipJobsCreated", ValueRaw = "0" },
          new() { Key = "entrepreneurshipFundingTypes", ValueRaw = "Grant,Bootstrapping" }
        ]
      });

      Assert.Equal("False", request.Attributes["MyOpportunity_entrepreneurshipBusinessRegistered"]);
      Assert.Equal("0", request.Attributes["MyOpportunity_entrepreneurshipJobsCreated"]);
      var funding = JsonConvert.DeserializeObject<List<SSICredentialAttributeItem>>(
        request.Attributes["MyOpportunity_entrepreneurshipFundingTypes"])!;
      Assert.Equal(new[] { "Grants, donations", "Bootstrapping" }, funding.Select(item => item.Name));
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

      var location = Assert.Single(detail.Attributes, attribute => attribute.Name == "Opportunity_Countries");
      Assert.Equal("Cape Town, Western Cape, South Africa", Assert.Single(location.ItemsDisplay!).Name);
      var engagement = Assert.Single(detail.Attributes, attribute => attribute.Name == "Opportunity_EngagementType");
      Assert.Equal("On-site", engagement.ValueDisplay);

      foreach (var field in fields)
      {
        var attribute = Assert.Single(detail.Attributes, attribute => attribute.Name == field.AttributeName);
        Assert.Equal(field.NameDisplay, attribute.NameDisplay);
        Assert.Equal(field.Group, attribute.Group);
        Assert.Equal(field.SortOrder, attribute.SortOrder);
        if (field.SupportsMultiple == true)
          Assert.Equal(new[] { "First label, with a comma", "Second label — café" }, attribute.ItemsDisplay!.Select(item => item.Name));
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
      Assert.Equal(groups.Select(group => group.Key)
        .OrderBy(group => string.IsNullOrEmpty(group) ? 1 : 0)
        .ThenBy(group => group), groups.Select(group => group.Key));
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
      return schema.Entities
        .SelectMany(entity => (entity.Properties?.Select(property => property.AttributeName) ?? [])
          .Concat(entity.CustomFields?.Select(field => field.AttributeName) ?? []))
        .ToHashSet();
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

      public List<Moq.IInvocation> Errors => _logger.Invocations
        .Where(invocation => invocation.Method.Name == "Log" && invocation.Arguments[0] is LogLevel.Error)
        .ToList();

      public Fixture()
      {
        _logger.Setup(logger => logger.IsEnabled(It.IsAny<LogLevel>())).Returns(true);

        var operations = new ApplicationDb_CF_Configuration().UpOperations;
        Definitions = ReadDefinitions(operations);
        Entities = ReadEntities(operations);
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
          .Returns((CustomFieldEntityType entity, bool _, bool _, string? context) => Definitions
            .Where(definition => definition.EntityType == entity.ToString() && definition.IsActive &&
              (definition.EntityContext == null || definition.EntityContext == context)).ToList());
        _definitionService.Setup(service => service.ListAll(It.IsAny<CustomFieldEntityType>(), false, It.IsAny<bool>()))
          .Returns((CustomFieldEntityType entity, bool _, bool active) => Definitions
            .Where(definition => definition.EntityType == entity.ToString() && (!active || definition.IsActive)).ToList());
        _definitionService.Setup(service => service.GetByKey(It.IsAny<CustomFieldEntityType>(), It.IsAny<string>(), true, false))
          .Returns((CustomFieldEntityType entity, string key, bool _, bool _) => Definitions
            .Single(definition => definition.EntityType == entity.ToString() && definition.Key == key));
        _definitionService.Setup(service => service.MarkSchemaMapped(It.IsAny<List<Guid>>())).Returns(Task.CompletedTask);
        _valueService.Setup(service => service.ResolveDisplayValues(It.IsAny<CustomFieldDefinition>(), It.IsAny<CustomFieldValueItem>()))
          .Returns((CustomFieldDefinition _, CustomFieldValueItem value) => value.ValueRaw == null ? [] : new List<string> { value.ValueRaw });

        EntityService = new SSISchemaEntityService(Options.Create(Settings), _cache, typeService.Object,
          repository.Object, _definitionService.Object, opportunityTypes.Object);
        var factory = new Mock<ISSIProviderClientFactory>();
        factory.Setup(provider => provider.CreateClient()).Returns(Provider.Object);
        Provider.Setup(provider => provider.ListSchemas(It.IsAny<bool>())).ReturnsAsync(() => Schemas.ToList());
        RestoreProviderWrites();
        Service = new SSISchemaService(Options.Create(Settings), _cache, factory.Object, EntityService,
          _definitionService.Object, typeService.Object, new SchemaRequestValidatorCreate(EntityService, typeService.Object),
          new SchemaRequestValidatorUpdate(EntityService));
        var environment = new Mock<IEnvironmentProvider>();
        environment.SetupGet(provider => provider.Environment).Returns(Domain.Core.Environment.Local);
        Lock.Setup(service => service.TryAcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<string>())).ReturnsAsync(true);
        Background = new SSIBackgroundService(_logger.Object, Options.Create(Settings), environment.Object,
          Options.Create(new ScheduleJobOptions()), Mock.Of<IServiceScopeFactory>(), Service, EntityService,
          Mock.Of<ISSITenantService>(), Mock.Of<ISSICredentialService>(), Lock.Object);
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
              AttributeNames = request.Attributes.ToList()
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

      private static List<CustomFieldDefinition> ReadDefinitions(IReadOnlyList<MigrationOperation> operations)
      {
        var results = new List<CustomFieldDefinition>();
        foreach (var operation in operations.OfType<InsertDataOperation>()
          .Where(operation => operation.Schema == "Core" && operation.Table == "CustomFieldDefinition"))
        {
          for (var row = 0; row < operation.Values.GetLength(0); row++)
          {
            object? Value(string column) => Array.IndexOf(operation.Columns, column) is var index && index >= 0
              ? operation.Values[row, index] : null;
            results.Add(new CustomFieldDefinition
            {
              Id = Guid.Parse(Value("Id")!.ToString()!),
              EntityType = (string)Value("EntityType")!,
              EntityContext = (string?)Value("EntityContext"),
              Key = (string)Value("Key")!,
              Title = (string)Value("Title")!,
              Description = (string?)Value("Description"),
              Group = (string)Value("Group")!,
              SubGroup = (string?)Value("SubGroup"),
              DataType = Enum.Parse<CustomFieldDataType>((string)Value("DataType")!),
              LookupType = Value("LookupType") is string lookup ? Enum.Parse<CustomFieldLookupType>(lookup) : null,
              IsRequired = (bool)Value("IsRequired")!,
              SupportsMultiple = (bool?)Value("SupportsMultiple"),
              SortOrder = (int)Value("SortOrder")!,
              IsActive = (bool)Value("IsActive")!,
              IsSystem = (bool)Value("IsSystem")!
            });
          }
        }
        return results;
      }

      private static List<SSISchemaEntity> ReadEntities(IReadOnlyList<MigrationOperation> operations)
      {
        var opportunity = new SSISchemaType
        {
          Id = Guid.Parse("7818B5C3-3D57-4264-B90B-DF53EAA9F749"),
          Type = SchemaType.Opportunity,
          Name = "Opportunity",
          SupportMultiple = true
        };
        var yoID = new SSISchemaType
        {
          Id = Guid.Parse("EC978798-AAC0-4577-846E-1B5B2E6663CE"),
          Type = SchemaType.YoID,
          Name = "YoID"
        };
        var entities = new List<SSISchemaEntity>
        {
          new()
          {
            Id = Guid.Parse("AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC"),
            Name = "User",
            TypeName = typeof(Domain.Entity.Models.User).FullName!,
            Properties = [],
            Types = [yoID]
          },
          new()
          {
            Id = Guid.Parse("B8C64B98-61C2-43F8-A583-7A7927340333"),
            Name = "Organization",
            TypeName = typeof(Domain.Entity.Models.Organization).FullName!,
            Properties = [],
            Types = [yoID]
          },
          new()
          {
            Id = Guid.Parse("E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D"),
            Name = "Opportunity",
            TypeName = typeof(Domain.Opportunity.Models.Opportunity).FullName!,
            Properties = [],
            Types = [opportunity]
          },
          new()
          {
            Id = Guid.Parse("CA11D9D0-39F6-46D8-A0D3-350EC41402F5"),
            Name = "MyOpportunity",
            TypeName = typeof(Domain.MyOpportunity.Models.MyOpportunity).FullName!,
            Properties = [],
            Types = [opportunity]
          }
        };
        var inserts = new ApplicationDb_Initial().UpOperations.OfType<InsertDataOperation>()
          .Concat(operations.OfType<InsertDataOperation>())
          .Where(operation => operation.Schema == "SSI" && operation.Table == "SchemaEntityProperty");
        foreach (var operation in inserts)
        {
          for (var row = 0; row < operation.Values.GetLength(0); row++)
          {
            object? Value(string column) => Array.IndexOf(operation.Columns, column) is var index && index >= 0
              ? operation.Values[row, index] : null;
            var name = (string)Value("Name")!;
            if (name == "YomaReward") continue; // Removed by the cash-out migration before CF.
            var entity = entities.Single(item => item.Id == Guid.Parse(Value("SSISchemaEntityId")!.ToString()!));
            entity.Properties!.Add(new SSISchemaEntityProperty
            {
              Id = Guid.Parse(Value("Id")!.ToString()!),
              Name = name,
              NameDisplay = (string)Value("NameDisplay")!,
              Description = (string)Value("Description")!,
              Group = (string?)Value("Group"),
              SubGroup = (string?)Value("SubGroup"),
              SortOrder = (int?)Value("SortOrder"),
              System = Value("SystemType") != null,
              SystemType = Value("SystemType") is string system ? Enum.Parse<SchemaEntityPropertySystemType>(system) : null,
              Format = (string?)Value("Format"),
              Required = (bool)Value("Required")!
            });
          }
        }

        var updates = new ApplicationDb_Authentication_PhoneNumber().UpOperations.OfType<UpdateDataOperation>()
          .Concat(new ApplicationDb_Custom_Fields_Treasury_Payout_SSI().UpOperations.OfType<UpdateDataOperation>())
          .Concat(operations.OfType<UpdateDataOperation>())
          .Where(operation => operation.Schema == "SSI" && operation.Table == "SchemaEntityProperty");
        foreach (var operation in updates)
        {
          var idColumn = Array.IndexOf(operation.KeyColumns, "Id");
          var systemTypeColumn = Array.IndexOf(operation.Columns, "SystemType");
          var requiredColumn = Array.IndexOf(operation.Columns, "Required");
          var groupColumn = Array.IndexOf(operation.Columns, "Group");
          var subGroupColumn = Array.IndexOf(operation.Columns, "SubGroup");
          var sortOrderColumn = Array.IndexOf(operation.Columns, "SortOrder");
          for (var row = 0; row < operation.Values.GetLength(0); row++)
          {
            var id = Guid.Parse(operation.KeyValues[row, idColumn]!.ToString()!);
            var property = entities.SelectMany(entity => entity.Properties!).Single(property => property.Id == id);
            if (systemTypeColumn >= 0)
            {
              var systemType = operation.Values[row, systemTypeColumn]?.ToString();
              property.System = !string.IsNullOrEmpty(systemType);
              property.SystemType = systemType == null ? null : Enum.Parse<SchemaEntityPropertySystemType>(systemType);
            }
            if (requiredColumn >= 0)
              property.Required = (bool)operation.Values[row, requiredColumn]!;
            if (groupColumn >= 0)
              property.Group = (string?)operation.Values[row, groupColumn];
            if (subGroupColumn >= 0)
              property.SubGroup = (string?)operation.Values[row, subGroupColumn];
            if (sortOrderColumn >= 0)
              property.SortOrder = (int?)operation.Values[row, sortOrderColumn];
          }
        }
        return entities;
      }
    }
    #endregion Private Members
  }
}
