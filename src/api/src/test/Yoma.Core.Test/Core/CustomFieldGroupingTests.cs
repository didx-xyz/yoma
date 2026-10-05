using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Xunit;
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.Core
{
  public class CustomFieldGroupingTests
  {
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
        [("Opportunity", "ImpactAction", "Activity")] = 1,
        [("Opportunity", "Job", "Requirements")] = 3,
        [("Opportunity", "Job", "Compensation")] = 5,
        [("Opportunity", "Job", "Employment")] = 4,
        [("Opportunity", "Job", "Classification")] = 2,
        [("Opportunity", "Entrepreneurship", "Programme")] = 3,
        [("MyOpportunity", "Job", "Placement")] = 1,
        [("MyOpportunity", "ImpactAction", "Impact")] = 1,
        [("MyOpportunity", "Event", "Participation")] = 1,
        [("MyOpportunity", "Entrepreneurship", "Venture")] = 5,
        [("MyOpportunity", "Entrepreneurship", "Outcomes")] = 7
      };

      Assert.Equal(39, counts.Values.Sum());
      Assert.Equal(expected.Count, counts.Count);
      foreach (var (key, count) in expected)
        Assert.Equal(count, counts[key]);
    }
  }
}
