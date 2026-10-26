using FluentValidation;
using Moq;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Test.Core.Fixtures;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Services;

namespace Yoma.Core.Test.Core
{
  public class OpportunityImpactActionCustomFieldTests
  {
    #region Class Variables
    private static readonly string[] ImpactActionGroups = ["Requirements", "Completion Details"];
    #endregion Class Variables

    #region Tests

    [Theory]
    [InlineData(null, null)]
    [InlineData("Computer|Smartphone", null)]
    [InlineData("Other", "Water sampling kit")]
    [InlineData("Computer|Other", "Water sampling kit")]
    public void OptionalToolsAndValidOtherPairsAreAccepted(string? tools, string? description)
    {
      ValidateRelationship(tools, description);
    }

    [Theory]
    [InlineData("Other", null)]
    [InlineData("Other", "   ")]
    [InlineData("Computer", "Water sampling kit")]
    [InlineData(null, "Water sampling kit")]
    public void ManualCaptureRequiresCompleteOtherPairs(string? tools, string? description)
    {
      Assert.Throws<ValidationException>(() => ValidateRelationship(tools, description));
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("Other", null)]
    [InlineData("Other", "   ")]
    [InlineData(null, "Water sampling kit")]
    [InlineData("Computer", null)]
    public void ImportsAndSyncAllowMissingOtherCompanions(string? tools, string? description)
    {
      ValidateRelationship(tools, description, false);
    }

    [Fact]
    public void ImportsAndSyncRejectKnownContradictoryOtherCompanions()
    {
      Assert.Throws<ValidationException>(() => ValidateRelationship("Computer", "Water sampling kit", false));
    }

    [Fact]
    public void FrameworkEnforcesOptionsCardinalityAndDescriptionLength()
    {
      var service = ValueService();
      service.Validate(CustomFieldEntityType.Opportunity, "ImpactAction", null, CustomFieldUpsertMode.PutEnforceRequired);
      service.Validate(CustomFieldEntityType.Opportunity, "ImpactAction",
        [new CustomFieldValueRequest { Key = CustomFieldConstants.ImpactAction.Tools.OtherDescription, Value = new string('x', 500) }],
        CustomFieldUpsertMode.PutEnforceRequired);

      Assert.Throws<ValidationException>(() => service.Validate(CustomFieldEntityType.Opportunity, "ImpactAction",
        [new CustomFieldValueRequest { Key = CustomFieldConstants.ImpactAction.Tools.OtherDescription, Value = new string('x', 501) }],
        CustomFieldUpsertMode.PutEnforceRequired));
      Assert.Throws<ValidationException>(() => service.Validate(CustomFieldEntityType.Opportunity, "ImpactAction",
        [new CustomFieldValueRequest { Key = CustomFieldConstants.ImpactAction.Tools.Required, Values = ["NotATool"] }],
        CustomFieldUpsertMode.PutEnforceRequired));
      Assert.Throws<ValidationException>(() => service.Validate(CustomFieldEntityType.Opportunity, "ImpactAction",
        [new CustomFieldValueRequest { Key = "ImpactActionVerifiedActivityType", Values = ["VerifiedFacilitationSession", "WaterQualityMonitoringSession"] }],
        CustomFieldUpsertMode.PutEnforceRequired));
    }

    [Fact]
    public void CsvResolvesMultipleToolsAndActivityDisplayNamesThroughMetadata()
    {
      var values = ValueService().ParseCSVValues(CustomFieldEntityType.Opportunity, "ImpactAction", new Dictionary<string, string?>
      {
        { CustomFieldConstants.ImpactAction.Tools.Required, "GPS device|Other" },
        { CustomFieldConstants.ImpactAction.Tools.OtherDescription, "Water sampling kit" },
        { "ImpactActionVerifiedActivityType", "Water quality monitoring session" }
      });

      var tools = Assert.Single(values!, o => o.Key == CustomFieldConstants.ImpactAction.Tools.Required);
      Assert.Equal(["GpsDevice", ImpactActionTool.Other.ToString()], tools.Values);
      var activity = Assert.Single(values!, o => o.Key == "ImpactActionVerifiedActivityType");
      Assert.Equal("WaterQualityMonitoringSession", Assert.Single(activity.Values!));
    }
    #endregion

    #region Private Members
    private static List<CustomFieldDefinition> Definitions() =>
      [.. CustomFieldFixtureData.CreateDefinitions().Where(definition =>
        definition.EntityType == nameof(CustomFieldEntityType.Opportunity) &&
        definition.EntityContext == nameof(Domain.Opportunity.Type.ImpactAction) && !definition.IsRequired)];

    private static void ValidateRelationship(string? tools, string? description, bool enforceRequired = true)
    {
      var method = typeof(OpportunityService).GetMethod("AssertCrossFieldRules", BindingFlags.NonPublic | BindingFlags.Static)!;
      var fields = new List<CustomFieldValueItem>();
      if (tools != null)
        fields.Add(new CustomFieldValueItem
        {
          Key = CustomFieldConstants.ImpactAction.Tools.Required,
          DataType = CustomFieldDataType.Option,
          ValueRaw = tools
        });

      if (description != null)
        fields.Add(new CustomFieldValueItem
        {
          Key = CustomFieldConstants.ImpactAction.Tools.OtherDescription,
          DataType = CustomFieldDataType.String,
          ValueRaw = description
        });

      try
      {
        method.Invoke(null, [new Domain.Opportunity.Models.Opportunity
        {
          Type = Domain.Opportunity.Type.ImpactAction,
          CustomFields = fields
        }, enforceRequired]);
      }
      catch (TargetInvocationException exception) when (exception.InnerException != null)
      {
        System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(exception.InnerException).Throw();
      }
    }

    private static CustomFieldValueService ValueService()
    {
      var definitions = new Mock<ICustomFieldDefinitionService>();
      definitions.Setup(o => o.List(CustomFieldEntityType.Opportunity, true, true, "ImpactAction")).Returns(Definitions());
      return new CustomFieldValueService(
        definitions.Object, Mock.Of<ICountryService>(), Mock.Of<ILanguageService>(),
        Mock.Of<ISkillService>(), Mock.Of<IEducationService>(), Mock.Of<ICurrencyService>(),
        Mock.Of<IRepository<CustomFieldValue>>(), Mock.Of<IExecutionStrategyService>());
    }

    #endregion
  }
}
