using FluentValidation;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Moq;
using Newtonsoft.Json;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.Core
{
  public class OpportunityDifficultyTests
  {
    #region Tests
    [Fact]
    public void SeedsRealRequiredSingleSelectDefinitionsBeforeRemovingCoreStorage()
    {
      var definitions = Definitions();
      Assert.Equal(5, definitions.Count);
      Assert.Equal(18, definitions.Sum(o => o.Options!.Count));
      Assert.All(definitions, definition =>
      {
        Assert.True(definition.IsRequired);
        Assert.Equal(definition.EntityContext != Domain.Opportunity.Type.Job.ToString(), definition.IsSystem);
        Assert.True(definition.IsActive);
        Assert.False(definition.SupportsMultiple);
        Assert.Equal(CustomFieldDataType.Option, definition.DataType);
        Assert.DoesNotContain("[Sample]", definition.Title);
        Assert.Equal("Requirements", definition.SubGroup);
        Assert.Equal(10, definition.SortOrder);
        Assert.EndsWith(" details", definition.Group);
        Assert.Equal(Enumerable.Range(1, definition.Options!.Count).Select(o => o * 10),
          definition.Options.Select(o => o.SortOrder));
      });

      var operations = new ApplicationDb_CF_Configuration().UpOperations.ToList();
      var backfill = Assert.Single(operations.OfType<SqlOperation>(), o =>
        o.Sql.Contains("INSERT INTO \"Core\".\"CustomFieldValue\""));
      var drop = Assert.Single(operations.OfType<DropColumnOperation>(), o => o.Name == "DifficultyId");
      Assert.True(operations.IndexOf(backfill) < operations.IndexOf(drop));
      Assert.Contains("WHERE type.\"Name\" <> 'Job'", backfill.Sql);
      Assert.Contains("JOIN \"Opportunity\".\"OpportunityType\" type", backfill.Sql);
    }

    [Fact]
    public void CodeContractsAndDefaultAgreeWithSeededMetadata()
    {
      var definitions = Definitions();
      foreach (var field in typeof(Domain.Opportunity.CustomFieldConstants.Difficulty.Keys).GetFields(BindingFlags.Public | BindingFlags.Static))
      {
        var key = Assert.IsType<string>(field.GetRawConstantValue());
        var definition = Assert.Single(definitions, o => o.Key == key);
        Assert.True(definition.IsSystem);
      }

      foreach (var field in typeof(Domain.Opportunity.CustomFieldConstants.Difficulty.Options)
        .GetFields(BindingFlags.Public | BindingFlags.Static))
      {
        var key = Assert.IsType<string>(field.GetRawConstantValue());
        Assert.Contains(definitions.SelectMany(o => o.Options!), o => o.Key == key);
      }

      foreach (var definition in definitions.Where(o =>
        o.EntityContext == Domain.Opportunity.Type.Learning.ToString() || o.EntityContext == Domain.Opportunity.Type.Other.ToString()))
      {
        var option = Assert.Single(definition.Options!, o =>
          o.Key == Domain.Opportunity.Difficulty.AnyLevel.ToString());
        Assert.Equal(Domain.Opportunity.Difficulty.AnyLevel.ToDescription(), option.Name);
      }
    }

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

    [Theory]
    [InlineData("IXO")]
    [InlineData("Umuzi")]
    public void PartnerMappingsReferenceSeededDefinitionsAndOptions(string partner)
    {
      var type = partner == "IXO"
        ? typeof(Infrastructure.IXO.PartnerSync.Client.IXOClient)
        : typeof(Infrastructure.Umuzi.Client.UmuziClient);
      var field = type.GetField("DifficultyMappings", BindingFlags.NonPublic | BindingFlags.Static)!;
      var mappings = Assert.IsType<Dictionary<Domain.Opportunity.Type, (string Key, Dictionary<string, string> Options)>>(field.GetValue(null));

      Assert.DoesNotContain(Domain.Opportunity.Type.Job, mappings.Keys);
      foreach (var mapping in mappings)
      {
        var definition = Assert.Single(Definitions(), o => o.Key == mapping.Value.Key);
        Assert.Equal(mapping.Key.ToString(), definition.EntityContext);
        Assert.True(definition.IsSystem);
        Assert.True(mapping.Value.Options.ContainsKey(Domain.Opportunity.Difficulty.AnyLevel.ToString()));
        Assert.All(mapping.Value.Options.Values, value => definition.ToOptionRequest(value));
      }
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
      Assert.Null(typeof(OpportunityRequestBase).GetProperty("DifficultyId"));
      Assert.Null(typeof(Infrastructure.Database.Opportunity.Entities.Opportunity).GetProperty("DifficultyId"));
    }
    #endregion

    #region Private Members
    private static CustomFieldValueService CreateValueService(ICustomFieldDefinitionService definitions)
    {
      return new CustomFieldValueService(definitions, Mock.Of<ICountryService>(), Mock.Of<ILanguageService>(),
        Mock.Of<ISkillService>(), Mock.Of<IRepository<CustomFieldValue>>(), Mock.Of<IExecutionStrategyService>());
    }

    private static List<CustomFieldDefinition> Definitions()
    {
      var seeds = new ApplicationDb_CF_Configuration().UpOperations.OfType<InsertDataOperation>().ToList();
      var definitions = Assert.Single(seeds, o => o.Table == "CustomFieldDefinition");
      var options = Assert.Single(seeds, o => o.Table == "CustomFieldOption");
      var result = new List<CustomFieldDefinition>();

      for (var row = 0; row < definitions.Values.GetLength(0); row++)
      {
        object Value(string name) => definitions.Values[row, Array.IndexOf(definitions.Columns, name)]!;
        result.Add(new CustomFieldDefinition
        {
          Id = (Guid)Value("Id"),
          EntityType = (string)Value("EntityType"),
          EntityContext = (string)Value("EntityContext"),
          Key = (string)Value("Key"),
          Title = (string)Value("Title"),
          Group = (string)Value("Group"),
          SubGroup = (string)Value("SubGroup"),
          DataType = Enum.Parse<CustomFieldDataType>((string)Value("DataType")),
          IsRequired = (bool)Value("IsRequired"),
          SupportsMultiple = (bool)Value("SupportsMultiple"),
          IsActive = (bool)Value("IsActive"),
          IsSystem = (bool)Value("IsSystem"),
          SortOrder = (int)Value("SortOrder"),
          Options = []
        });
      }

      for (var row = 0; row < options.Values.GetLength(0); row++)
      {
        object Value(string name) => options.Values[row, Array.IndexOf(options.Columns, name)]!;
        var definition = result.Single(o => o.Id == (Guid)Value("CustomFieldDefinitionId"));
        definition.Options!.Add(new CustomFieldOption
        {
          Id = (Guid)Value("Id"),
          Key = (string)Value("Key"),
          Name = (string)Value("Name"),
          SortOrder = (int)Value("SortOrder"),
          IsActive = (bool)Value("IsActive")
        });
      }

      return result;
    }
    #endregion
  }
}
