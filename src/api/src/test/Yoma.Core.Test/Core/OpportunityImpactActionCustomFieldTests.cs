using FluentValidation;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Moq;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.Core
{
  public class OpportunityImpactActionCustomFieldTests
  {
    #region Tests
    [Fact]
    public void SeedsOptionalImpactActionFieldsWithoutDuplicatingCoreOrCompletionFields()
    {
      var definitions = Definitions();
      Assert.Equal(3, definitions.Count);
      Assert.All(definitions, o =>
      {
        Assert.Equal("ImpactAction", o.EntityContext);
        Assert.Equal("Impact action details", o.Group);
        Assert.False(o.IsRequired);
        Assert.True(o.IsActive);
        Assert.False(o.IsSchemaMapped);
      });

      var tools = Assert.Single(definitions, o => o.Key == CustomFieldConstants.ImpactAction.Tools.Required);
      Assert.True(tools.SupportsMultiple);
      Assert.True(tools.IsSystem);
      Assert.Equal("Requirements", tools.SubGroup);
      Assert.Equal(13, tools.Options!.Count);
      Assert.Equal(ImpactActionTool.Other.ToString(), tools.Options.Last().Key);

      var activity = Assert.Single(definitions, o => o.Key == "impactActionVerifiedActivityType");
      Assert.False(activity.SupportsMultiple);
      Assert.False(activity.IsSystem);
      Assert.Equal(3, activity.Options!.Count);
    }

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
        [new CustomFieldValueRequest { Key = "impactActionVerifiedActivityType", Values = ["VerifiedFacilitationSession", "WaterQualityMonitoringSession"] }],
        CustomFieldUpsertMode.PutEnforceRequired));
    }

    [Fact]
    public void CsvResolvesMultipleToolsAndActivityDisplayNamesThroughMetadata()
    {
      var values = ValueService().ParseCSVValues(CustomFieldEntityType.Opportunity, "ImpactAction", new Dictionary<string, string?>
      {
        { CustomFieldConstants.ImpactAction.Tools.Required, "GPS device|Other" },
        { CustomFieldConstants.ImpactAction.Tools.OtherDescription, "Water sampling kit" },
        { "impactActionVerifiedActivityType", "Water quality monitoring session" }
      });

      var tools = Assert.Single(values!, o => o.Key == CustomFieldConstants.ImpactAction.Tools.Required);
      Assert.Equal(["GpsDevice", ImpactActionTool.Other.ToString()], tools.Values);
      var activity = Assert.Single(values!, o => o.Key == "impactActionVerifiedActivityType");
      Assert.Equal("WaterQualityMonitoringSession", Assert.Single(activity.Values!));
    }
    #endregion

    #region Private Members
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

    private static List<CustomFieldDefinition> Definitions()
    {
      var seeds = new ApplicationDb_CF_Configuration().UpOperations.OfType<InsertDataOperation>().ToList();
      var definitions = Assert.Single(seeds, o => o.Table == "CustomFieldDefinition" &&
        o.Values[0, 0] is Guid id && id == new Guid("cf0a0001-0929-4cf0-a100-000000000001"));
      var options = Assert.Single(seeds, o => o.Table == "CustomFieldOption" &&
        o.Values[0, 0] is Guid id && id == new Guid("cf0a0001-0929-4cf0-a100-000000000101"));
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
