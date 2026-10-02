using FluentValidation;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.Core
{
  public class MyOpportunityCustomFieldTests
  {
    #region Tests
    [Fact]
    public void SeedsOnlyOptionalTypeSpecificCompletionFields()
    {
      var definitions = Definitions();
      Assert.Equal(3, definitions.Count);
      Assert.All(definitions, definition =>
      {
        Assert.Equal(CustomFieldEntityType.MyOpportunity.ToString(), definition.EntityType);
        Assert.Equal("Completion details", definition.Group);
        Assert.False(definition.IsRequired);
        Assert.False(definition.IsSchemaMapped);
      });

      Assert.Equal(CustomFieldDataType.Date, Assert.Single(definitions, o => o.EntityContext == "Job").DataType);
      Assert.Equal(CustomFieldDataType.String, Assert.Single(definitions, o => o.EntityContext == "ImpactAction").DataType);

      var role = Assert.Single(definitions, o => o.EntityContext == "Event");
      Assert.Equal(CustomFieldDataType.Option, role.DataType);
      Assert.False(role.IsRequired);
      Assert.False(role.IsSystem);
      Assert.Equal(6, role.Options!.Count);
      Assert.Equal("Participant", role.Options[0].Key);
    }

    [Fact]
    public void EmploymentStartDateAcceptsOnlyRealIsoDates()
    {
      var service = ValueService("Job");
      service.Validate(CustomFieldEntityType.MyOpportunity, "Job", null, CustomFieldUpsertMode.PutEnforceRequired);
      service.Validate(CustomFieldEntityType.MyOpportunity, "Job",
        [new CustomFieldValueRequest { Key = "jobEmploymentStartDate", Value = "2026-09-29" }],
        CustomFieldUpsertMode.PutEnforceRequired);

      foreach (var invalid in new[] { "2026-02-30", "29/09/2026", "2026-09-29T00:00:00Z" })
        Assert.Throws<ValidationException>(() => service.Validate(CustomFieldEntityType.MyOpportunity, "Job",
          [new CustomFieldValueRequest { Key = "jobEmploymentStartDate", Value = invalid }],
          CustomFieldUpsertMode.PutEnforceRequired));

      var parsed = service.ParseCSVValues(CustomFieldEntityType.MyOpportunity, "Job",
        new Dictionary<string, string?> { ["jobEmploymentStartDate"] = "2026-09-29" });
      Assert.Equal("2026-09-29", Assert.Single(parsed!).Value);
    }

    [Fact]
    public void EventRoleAndImpactAchievedRemainOptionalButValidateSuppliedValues()
    {
      var eventService = ValueService("Event");
      eventService.Validate(CustomFieldEntityType.MyOpportunity, "Event", null, CustomFieldUpsertMode.PutEnforceRequired);
      eventService.Validate(CustomFieldEntityType.MyOpportunity, "Event",
        [new CustomFieldValueRequest { Key = "eventRole", Values = ["Speaker"] }],
        CustomFieldUpsertMode.PutEnforceRequired);
      Assert.Throws<ValidationException>(() => eventService.Validate(CustomFieldEntityType.MyOpportunity, "Event",
        [new CustomFieldValueRequest { Key = "eventRole", Values = ["Unknown"] }],
        CustomFieldUpsertMode.PutEnforceRequired));

      var impactService = ValueService("ImpactAction");
      impactService.Validate(CustomFieldEntityType.MyOpportunity, "ImpactAction", null, CustomFieldUpsertMode.PutEnforceRequired);
      Assert.Throws<ValidationException>(() => impactService.Validate(CustomFieldEntityType.MyOpportunity, "ImpactAction",
        [new CustomFieldValueRequest { Key = "impactActionImpactAchieved", Value = new string('x', 1001) }],
        CustomFieldUpsertMode.PutEnforceRequired));
    }

    [Theory]
    [InlineData(CustomFieldEntityType.Opportunity)]
    [InlineData(CustomFieldEntityType.MyOpportunity)]
    public void ConfiguredRequirednessAppliesToManualCaptureNotImportsOrSync(CustomFieldEntityType entityType)
    {
      var definition = new CustomFieldDefinition
      {
        Id = Guid.NewGuid(),
        EntityType = entityType.ToString(),
        EntityContext = "Event",
        Key = "requiredFlag",
        Title = "Required flag",
        DataType = CustomFieldDataType.Boolean,
        IsRequired = true,
        IsActive = true
      };
      var definitions = new Mock<ICustomFieldDefinitionService>();
      definitions.Setup(o => o.List(entityType, true, true, "Event"))
        .Returns([definition]);
      var service = new CustomFieldValueService(
        definitions.Object, Mock.Of<ICountryService>(), Mock.Of<ILanguageService>(),
        Mock.Of<ISkillService>(), Mock.Of<IEducationService>(), Mock.Of<ICurrencyService>(),
        Mock.Of<IRepository<CustomFieldValue>>(), Mock.Of<IExecutionStrategyService>());

      // Manual admin writes and youth submissions require configured mandatory values.
      Assert.Throws<ValidationException>(() => service.Validate(
        entityType, "Event", null, CustomFieldUpsertMode.PutEnforceRequired));
      service.Validate(entityType, "Event",
        [new CustomFieldValueRequest { Key = definition.Key, Value = "false" }],
        CustomFieldUpsertMode.PutEnforceRequired);

      // External capture permits omissions and explicit clearing, not malformed values.
      service.Validate(entityType, "Event", null, CustomFieldUpsertMode.PatchAllowMissingRequired);
      var cleared = new List<CustomFieldValueRequest> { new() { Key = definition.Key } };
      cleared.NormalizeForPatch();
      service.Validate(entityType, "Event", cleared, CustomFieldUpsertMode.PatchAllowMissingRequired);
      Assert.Throws<ValidationException>(() => service.Validate(entityType, "Event",
        [new CustomFieldValueRequest { Key = definition.Key, Value = "not-a-boolean" }],
        CustomFieldUpsertMode.PatchAllowMissingRequired));

      // Instant/action links deliberately do not process completion CFs.
      Assert.False(new Domain.MyOpportunity.Models.MyOpportunityVerificationOptions
      {
        InstantVerification = true
      }.CustomFieldUpsertMode.Process());
    }

    #endregion

    #region Private Members
    private static CustomFieldValueService ValueService(string context)
    {
      var definitions = new Mock<ICustomFieldDefinitionService>();
      definitions.Setup(o => o.List(CustomFieldEntityType.MyOpportunity, true, true, context))
        .Returns([.. Definitions().Where(o => o.EntityContext == context)]);

      return new CustomFieldValueService(
        definitions.Object, Mock.Of<ICountryService>(), Mock.Of<ILanguageService>(),
        Mock.Of<ISkillService>(), Mock.Of<IEducationService>(), Mock.Of<ICurrencyService>(),
        Mock.Of<IRepository<CustomFieldValue>>(), Mock.Of<IExecutionStrategyService>());
    }

    private static List<CustomFieldDefinition> Definitions()
    {
      var seeds = new ApplicationDb_CF_Configuration().UpOperations.OfType<InsertDataOperation>().ToList();
      var definitions = Assert.Single(seeds, o => o.Table == "CustomFieldDefinition" &&
        o.Values[0, 0] is Guid id && id == new Guid("cf0c0001-0929-4cf0-a100-000000000001"));
      var options = Assert.Single(seeds, o => o.Table == "CustomFieldOption" &&
        o.Values[0, 0] is Guid id && id == new Guid("cf0c0001-0929-4cf0-a100-000000000101"));
      var result = new List<CustomFieldDefinition>();

      for (var row = 0; row < definitions.Values.GetLength(0); row++)
      {
        object? Value(string name) => definitions.Values[row, Array.IndexOf(definitions.Columns, name)];
        result.Add(new CustomFieldDefinition
        {
          Id = (Guid)Value("Id")!,
          EntityType = (string)Value("EntityType")!,
          EntityContext = (string)Value("EntityContext")!,
          Key = (string)Value("Key")!,
          Title = (string)Value("Title")!,
          Group = (string)Value("Group")!,
          SubGroup = (string)Value("SubGroup")!,
          DataType = Enum.Parse<CustomFieldDataType>((string)Value("DataType")!),
          ValidationRegex = (string?)Value("ValidationRegex"),
          ValidationErrorMessage = (string?)Value("ValidationErrorMessage"),
          IsRequired = (bool)Value("IsRequired")!,
          SupportsMultiple = (bool?)Value("SupportsMultiple"),
          SortOrder = (int)Value("SortOrder")!,
          IsActive = (bool)Value("IsActive")!,
          IsSystem = (bool)Value("IsSystem")!,
          IsSchemaMapped = (bool)Value("IsSchemaMapped")!,
          Options = []
        });
      }

      for (var row = 0; row < options.Values.GetLength(0); row++)
      {
        object Value(string name) => options.Values[row, Array.IndexOf(options.Columns, name)]!;
        result.Single(o => o.Id == (Guid)Value("CustomFieldDefinitionId")).Options!.Add(new CustomFieldOption
        {
          Key = (string)Value("Key"),
          Name = (string)Value("Name"),
          IsActive = (bool)Value("IsActive")
        });
      }

      return result;
    }
    #endregion
  }
}
