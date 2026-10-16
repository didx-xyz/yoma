using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Xunit;
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.Core
{
  public class CustomFieldGroupingTests
  {
    [Fact]
    public void AllConfiguredFieldKeysUsePascalCaseAndLabelsUseTitleCase()
    {
      var definitions = new ApplicationDb_CF_Configuration().UpOperations
        .OfType<InsertDataOperation>()
        .Where(operation => operation.Schema == "Core" && operation.Table == "CustomFieldDefinition");

      var keys = new HashSet<string>(StringComparer.Ordinal);
      foreach (var operation in definitions)
      {
        for (var row = 0; row < operation.Values.GetLength(0); row++)
        {
          var key = Assert.IsType<string>(operation.Values[row, Array.IndexOf(operation.Columns, "Key")]);
          var context = Assert.IsType<string>(operation.Values[row, Array.IndexOf(operation.Columns, "EntityContext")]);
          var title = Assert.IsType<string>(operation.Values[row, Array.IndexOf(operation.Columns, "Title")]);
          Assert.StartsWith(context, key);
          Assert.Matches("^[A-Z][A-Za-z0-9]*$", key);
          Assert.True(keys.Add(key), $"Duplicate configured key '{key}'.");
          Assert.All(title.Split(' '), word =>
            Assert.True(!char.IsLetter(word[0]) || char.IsUpper(word[0]), $"Field label '{title}' is not Title Case."));
        }
      }

      Assert.Equal(39, keys.Count);
      Assert.Contains("EntrepreneurshipCustomerReach", keys);
      Assert.DoesNotContain("EntrepreneurshipClientLocation", keys);
    }

    [Fact]
    public void AllConfiguredFieldsUseOneMeaningfulGroupingLevel()
    {
      var definitions = new ApplicationDb_CF_Configuration().UpOperations
        .OfType<InsertDataOperation>()
        .Where(operation => operation.Schema == "Core" && operation.Table == "CustomFieldDefinition");

      var counts = new Dictionary<(string EntityType, string Context, string Group), int>();

      foreach (var operation in definitions)
      {
        for (var row = 0; row < operation.Values.GetLength(0); row++)
        {
          object? Value(string column) => operation.Values[row, Array.IndexOf(operation.Columns, column)];

          Assert.Null(Value("SubGroup"));
          var group = Assert.IsType<string>(Value("Group"));
          if (group != "Completion Details")
            Assert.DoesNotContain("details", group, StringComparison.OrdinalIgnoreCase);

          var key = (Assert.IsType<string>(Value("EntityType")),
            Assert.IsType<string>(Value("EntityContext")), group);
          counts[key] = counts.GetValueOrDefault(key) + 1;
        }
      }

      var expected = new Dictionary<(string EntityType, string Context, string Group), int>
      {
        [("Opportunity", "Learning", "Requirements")] = 1,
        [("Opportunity", "Other", "Requirements")] = 1,
        [("Opportunity", "Event", "Requirements")] = 1,
        [("Opportunity", "ImpactAction", "Requirements")] = 3,
        [("Opportunity", "ImpactAction", "Completion Details")] = 1,
        [("Opportunity", "Job", "Requirements")] = 3,
        [("Opportunity", "Job", "Compensation")] = 5,
        [("Opportunity", "Job", "Employment")] = 4,
        [("Opportunity", "Job", "Classification")] = 2,
        [("Opportunity", "Entrepreneurship", "Programme")] = 3,
        [("MyOpportunity", "Job", "Completion Details")] = 1,
        [("MyOpportunity", "ImpactAction", "Completion Details")] = 1,
        [("MyOpportunity", "Event", "Completion Details")] = 1,
        [("MyOpportunity", "Entrepreneurship", "Completion Details")] = 12
      };

      Assert.Equal(39, counts.Values.Sum());
      Assert.Equal(expected.Count, counts.Count);
      foreach (var (key, count) in expected)
        Assert.Equal(count, counts[key]);
    }
  }
}
