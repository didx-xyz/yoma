using FluentValidation;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Test.Core.Fixtures;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Test.Core
{
  public class MyOpportunityCustomFieldTests
  {
    #region Tests

    [Fact]
    public void EmploymentStartDateAcceptsOnlyRealIsoDates()
    {
      var service = ValueService("Job");
      service.Validate(CustomFieldEntityType.MyOpportunity, "Job", null, CustomFieldUpsertMode.PutEnforceRequired);
      service.Validate(CustomFieldEntityType.MyOpportunity, "Job",
        [new CustomFieldValueRequest { Key = "JobEmploymentStartDate", Value = "2026-09-29" }],
        CustomFieldUpsertMode.PutEnforceRequired);

      foreach (var invalid in new[] { "2026-02-30", "29/09/2026", "2026-09-29T00:00:00Z" })
        Assert.Throws<ValidationException>(() => service.Validate(CustomFieldEntityType.MyOpportunity, "Job",
          [new CustomFieldValueRequest { Key = "JobEmploymentStartDate", Value = invalid }],
          CustomFieldUpsertMode.PutEnforceRequired));

      var parsed = service.ParseCSVValues(CustomFieldEntityType.MyOpportunity, "Job",
        new Dictionary<string, string?> { ["JobEmploymentStartDate"] = "2026-09-29" });
      Assert.Equal("2026-09-29", Assert.Single(parsed!).Value);
    }

    [Fact]
    public void EventRoleAndImpactAchievedRemainOptionalButValidateSuppliedValues()
    {
      var eventService = ValueService("Event");
      eventService.Validate(CustomFieldEntityType.MyOpportunity, "Event", null, CustomFieldUpsertMode.PutEnforceRequired);
      eventService.Validate(CustomFieldEntityType.MyOpportunity, "Event",
        [new CustomFieldValueRequest { Key = "EventRole", Values = ["Speaker"] }],
        CustomFieldUpsertMode.PutEnforceRequired);
      Assert.Throws<ValidationException>(() => eventService.Validate(CustomFieldEntityType.MyOpportunity, "Event",
        [new CustomFieldValueRequest { Key = "EventRole", Values = ["Unknown"] }],
        CustomFieldUpsertMode.PutEnforceRequired));

      var impactService = ValueService("ImpactAction");
      impactService.Validate(CustomFieldEntityType.MyOpportunity, "ImpactAction", null, CustomFieldUpsertMode.PutEnforceRequired);
      Assert.Throws<ValidationException>(() => impactService.Validate(CustomFieldEntityType.MyOpportunity, "ImpactAction",
        [new CustomFieldValueRequest { Key = "ImpactActionImpactAchieved", Value = new string('x', 1001) }],
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
    private static List<CustomFieldDefinition> Definitions() =>
      [.. CustomFieldFixtureData.CreateDefinitions().Where(definition => definition.EntityType == nameof(CustomFieldEntityType.MyOpportunity))];

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

    #endregion
  }
}
