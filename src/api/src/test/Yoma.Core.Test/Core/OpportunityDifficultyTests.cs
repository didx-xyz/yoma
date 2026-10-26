using FluentValidation;
using Moq;
using Newtonsoft.Json;
using System.Reflection;
using System.Runtime.CompilerServices;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Test.Core.Fixtures;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Test.Core
{
  public class OpportunityDifficultyTests
  {
    #region Tests

    [Theory]
    [InlineData("Learning")]
    [InlineData("Other")]
    [InlineData("ImpactAction")]
    [InlineData("Event")]
    [InlineData("Job")]
    public void ExistingFrameworkEnforcesRequirednessOptionsAndContext(string context)
    {
      var definition = Assert.Single(Definitions(), o => o.EntityContext == context);
      var definitions = new Mock<ICustomFieldDefinitionService>();
      definitions.Setup(o => o.List(CustomFieldEntityType.Opportunity, true, true, context))
        .Returns([definition]);
      var service = CreateValueService(definitions.Object);

      Assert.Throws<ValidationException>(() => service.Validate(
        CustomFieldEntityType.Opportunity, context, null, CustomFieldUpsertMode.PutEnforceRequired));
      service.Validate(CustomFieldEntityType.Opportunity, context, null, CustomFieldUpsertMode.PatchAllowMissingRequired);

      var request = definition.ToOptionRequest(definition.Options![0].Name);
      service.Validate(CustomFieldEntityType.Opportunity, context, [request], CustomFieldUpsertMode.PutEnforceRequired);
      Assert.Equal(definition.Options[0].Key, Assert.Single(request.Values!));

      request.Values = ["not-an-option"];
      Assert.Throws<ValidationException>(() => service.Validate(
        CustomFieldEntityType.Opportunity, context, [request], CustomFieldUpsertMode.PutEnforceRequired));

      request.Key = Definitions().First(o => o.EntityContext != context).Key;
      Assert.Throws<ValidationException>(() => service.Validate(
        CustomFieldEntityType.Opportunity, context, [request], CustomFieldUpsertMode.PutEnforceRequired));
    }

    [Fact]
    public void CommonOptionResolutionUsesMetadataNotAnEnumOrDifficultyVocabulary()
    {
      var definition = new CustomFieldDefinition
      {
        Key = "unrelatedField",
        Title = "An unrelated field",
        DataType = CustomFieldDataType.Option,
        Options = [new CustomFieldOption { Key = "arbitrary-key", Name = "A renamed label", IsActive = true }]
      };

      Assert.Equal("arbitrary-key", definition.ResolveOptionKey("ARBITRARY-KEY"));
      Assert.Throws<ValidationException>(() => definition.ResolveOptionKey("A renamed label"));
      Assert.Equal("arbitrary-key", Assert.Single(definition.ToOptionRequest("A renamed label").Values!));

      definition.Options[0].IsActive = false;
      Assert.Throws<ValidationException>(() => definition.ToOptionRequest("arbitrary-key"));
    }

    [Fact]
    public void AlisonAlwaysEmitsDifficultyIncludingItsDefaultWhenSourceLevelIsWithdrawn()
    {
      var client = RuntimeHelpers.GetUninitializedObject(typeof(Infrastructure.Alison.Client.AlisonClient));
      SetDifficultyMetadata(client);
      var method = client.GetType().GetMethod("GetDifficulty", BindingFlags.Instance | BindingFlags.NonPublic)!;
      var previous = Assert.IsType<CustomFieldValueRequest>(method.Invoke(client,
        [new Infrastructure.Alison.Models.Course { CourseLevel = "Advanced" }]));
      var current = Assert.IsType<CustomFieldValueRequest>(method.Invoke(client,
        [new Infrastructure.Alison.Models.Course { CourseLevel = null }]));

      Assert.Equal(Domain.Opportunity.CustomFieldConstants.Difficulty.Keys.Learning, current.Key);
      Assert.Equal(Domain.Opportunity.Difficulty.AnyLevel.ToString(), Assert.Single(current.Values!));
      Assert.NotEqual(Assert.Single(previous.Values!), Assert.Single(current.Values!));
    }

    [Theory]
    [InlineData("IXO", Domain.Opportunity.Type.Learning, "AnyLevel")]
    [InlineData("IXO", Domain.Opportunity.Type.Other, "AnyLevel")]
    [InlineData("IXO", Domain.Opportunity.Type.ImpactAction, "EntryLevel")]
    [InlineData("IXO", Domain.Opportunity.Type.Event, "OpenToAll")]
    [InlineData("Umuzi", Domain.Opportunity.Type.Learning, "AnyLevel")]
    [InlineData("Umuzi", Domain.Opportunity.Type.Other, "AnyLevel")]
    [InlineData("Umuzi", Domain.Opportunity.Type.ImpactAction, "EntryLevel")]
    [InlineData("Umuzi", Domain.Opportunity.Type.Event, "OpenToAll")]
    public void PartnerDifficultyAlwaysReplacesPriorValuesWithTheConfiguredDefault(
      string partner, Domain.Opportunity.Type opportunityType, string expected)
    {
      var type = partner switch
      {
        "IXO" => typeof(Infrastructure.IXO.PartnerSync.Client.IXOClient),
        "Umuzi" => typeof(Infrastructure.Umuzi.Client.UmuziClient),
        _ => throw new InvalidOperationException($"Partner '{partner}' is not supported")
      };
      var client = RuntimeHelpers.GetUninitializedObject(type);
      SetDifficultyMetadata(client);
      var method = type.GetMethod("ResolveDifficulty", BindingFlags.Instance | BindingFlags.NonPublic)!;
      var previous = Assert.IsType<CustomFieldValueRequest>(method.Invoke(client, [opportunityType, "Advanced"]));
      var current = Assert.IsType<CustomFieldValueRequest>(method.Invoke(client, [opportunityType, null]));

      Assert.Equal(previous.Key, current.Key);
      Assert.Equal(expected, Assert.Single(current.Values!));
      Assert.NotEqual(Assert.Single(previous.Values!), Assert.Single(current.Values!));
    }

    [Fact]
    public void LegacyProjectionIsHiddenAndIssuerResolvesTheCurrentOptionLabel()
    {
      var definition = Assert.Single(Definitions(), o => o.EntityContext == "Learning");
      var selected = definition.Options![0];
      selected.Name = "Updated metadata label";
      var opportunity = new Opportunity
      {
        Type = Domain.Opportunity.Type.Learning,
        CustomFields = [new CustomFieldValueItem
        {
          Key = definition.Key,
          DataType = CustomFieldDataType.Option,
          ValueRaw = selected.Key
        }]
      };
      var definitions = new Mock<ICustomFieldDefinitionService>();
      definitions.Setup(o => o.GetByKey(CustomFieldEntityType.Opportunity, definition.Key, true, false))
        .Returns(definition);
      var bridge = typeof(Domain.SSI.Services.SSIBackgroundService)
        .GetMethod("ResolveLegacyDifficulty", BindingFlags.NonPublic | BindingFlags.Static)!;

      Assert.Equal(selected.Name, bridge.Invoke(null, [opportunity, definitions.Object, CreateValueService(definitions.Object)]));
      Assert.DoesNotContain("Difficulty", JsonConvert.SerializeObject(new Opportunity()), StringComparison.OrdinalIgnoreCase);
    }
    #endregion

    #region Private Members
    private static List<CustomFieldDefinition> Definitions() =>
      [.. CustomFieldFixtureData.CreateDefinitions().Where(definition =>
        definition.Key.EndsWith("Difficulty", StringComparison.Ordinal) ||
        definition.Key == Domain.Opportunity.CustomFieldConstants.Job.Experience.Level)];

    private static void SetDifficultyMetadata(object client)
    {
      var metadata = new Mock<ICustomFieldDefinitionService>();
      metadata.Setup(service => service.GetByKey(CustomFieldEntityType.Opportunity, It.IsAny<string>(), true, true))
        .Returns((CustomFieldEntityType _, string key, bool _, bool _) => Definitions().Single(definition => definition.Key == key));
      client.GetType().GetField("_customFieldDefinitionService", BindingFlags.Instance | BindingFlags.NonPublic)!
        .SetValue(client, metadata.Object);
    }

    private static CustomFieldValueService CreateValueService(ICustomFieldDefinitionService definitions)
    {
      return new CustomFieldValueService(definitions, Mock.Of<ICountryService>(), Mock.Of<ILanguageService>(),
        Mock.Of<ISkillService>(), Mock.Of<IEducationService>(), Mock.Of<ICurrencyService>(),
        Mock.Of<IRepository<CustomFieldValue>>(), Mock.Of<IExecutionStrategyService>());
    }

    #endregion
  }
}
