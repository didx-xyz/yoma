using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Xunit;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.Core
{
  public class CustomFieldHelpTextTests
  {
    #region Class Variables
    private static readonly string[] DescriptionColumns = ["Description"];

    private static readonly string[] InternalHelpTextTerms =
    [
      "manual capture", "schema", "lookup", "ISIC", "ISCO", "inferred",
      "placeholder", "omitted", "threshold", "USD-equivalent"
    ];
    #endregion

    #region Tests
    [Fact]
    public void HelpTextUpdatesOnlyDescriptionsOfExistingDefinitions()
    {
      var definitions = new ApplicationDb_CF_Configuration().UpOperations.OfType<InsertDataOperation>()
        .Where(operation => operation.Table == "CustomFieldDefinition")
        .SelectMany(operation => Enumerable.Range(0, operation.Values.GetLength(0)).Select(row =>
        {
          var descriptionColumn = Array.IndexOf(operation.Columns, "Description");
          return (Id: (Guid)operation.Values[row, Array.IndexOf(operation.Columns, "Id")]!,
            Description: descriptionColumn < 0 ? null : (string?)operation.Values[row, descriptionColumn]);
        })).ToDictionary(item => item.Id, item => item.Description);
      Assert.Equal(39, definitions.Count);

      var updates = new ApplicationDb_Job_Employment_Contract().UpOperations.OfType<UpdateDataOperation>().ToList();
      var updated = new HashSet<Guid>();
      foreach (var operation in updates)
      {
        Assert.Equal("Core", operation.Schema);
        Assert.Equal("CustomFieldDefinition", operation.Table);
        Assert.Equal(DescriptionColumns, operation.Columns);
        for (var row = 0; row < operation.KeyValues.GetLength(0); row++)
        {
          var id = (Guid)operation.KeyValues[row, 0]!;
          Assert.True(definitions.ContainsKey(id));
          Assert.True(updated.Add(id));
          definitions[id] = (string)operation.Values[row, 0]!;
        }
      }

      Assert.Equal(24, updated.Count);
      Assert.All(definitions.Values.Where(description => description != null), description =>
      {
        Assert.InRange(description!.Length, 1, 500);
        foreach (var internalTerm in InternalHelpTextTerms)
          Assert.DoesNotContain(internalTerm, description, StringComparison.OrdinalIgnoreCase);
      });
    }

    [Fact]
    public void ConsolidatedMetadataMigrationChangesOnlyContractAndHelpTextWithoutDatabaseAccess()
    {
      var migration = new ApplicationDb_Job_Employment_Contract();
      Assert.Single(migration.UpOperations.OfType<InsertDataOperation>());
      Assert.Equal(3, migration.UpOperations.OfType<UpdateDataOperation>().Count());
      Assert.Equal(4, migration.UpOperations.Count);
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql("Host=localhost;Database=not_contacted;Username=not_used;Password=not_used",
          options => options.UseNetTopologySuite()).Options);
      var script = context.GetService<IMigrator>().GenerateScript(
        "20261015090000_ApplicationDb_Treasury_CashOut_Release_Defaults",
        "20261019110000_ApplicationDb_Job_Employment_Contract");
      Assert.Contains("UPDATE \"Core\".\"CustomFieldDefinition\"", script);
      Assert.DoesNotContain("DELETE FROM", script);
      Assert.DoesNotContain("ALTER TABLE", script);
      Assert.DoesNotContain("\"CustomFieldValue\"", script);
      Assert.False(context.Database.HasPendingModelChanges());
    }
    #endregion
  }
}
