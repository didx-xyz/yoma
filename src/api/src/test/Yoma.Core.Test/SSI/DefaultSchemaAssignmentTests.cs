using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Npgsql;
using Xunit;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.SSI
{
  public class DefaultSchemaAssignmentTests
  {
    #region Tests
    [Fact]
    public void DefaultReassignmentIsTransactionalMigrationWorkNotAStartupRepositoryUpdate()
    {
      var operation = AssignmentOperation();
      Assert.False(operation.SuppressTransaction);
      Assert.DoesNotContain("\"SSI\".", operation.Sql);
      Assert.Contains("\"CredentialIssuanceEnabled\" = true", operation.Sql);
    }

    [Fact]
    public async Task MigrationReassignsOnlyEnabledGenericDefaultsAndPreservesExistingQueues()
    {
      var value = System.Environment.GetEnvironmentVariable("YOMA_SSI_ASSIGNMENT_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrWhiteSpace(value),
        "Set YOMA_SSI_ASSIGNMENT_TEST_CONNECTION to an isolated local yoma_ssi_assignment_* database.");
      var builder = new NpgsqlConnectionStringBuilder(value);
      Assert.True(builder.Host is "localhost" or "127.0.0.1");
      Assert.StartsWith("yoma_ssi_assignment_", builder.Database);

      await using var connection = new NpgsqlConnection(builder.ConnectionString);
      var cancellationToken = TestContext.Current.CancellationToken;
      await connection.OpenAsync(cancellationToken);
      await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

      // Apply the actual migration operation to an isolated fixture. Disposal rolls back both
      // fixture creation and reassignment, without touching an existing Yoma database.
      await using (var fixture = new NpgsqlCommand("""
        CREATE SCHEMA "Opportunity";
        CREATE SCHEMA "SSI";

        CREATE TABLE "Opportunity"."OpportunityType" (
          "Id" uuid PRIMARY KEY,
          "Name" varchar(50) NOT NULL
        );

        CREATE TABLE "Opportunity"."Opportunity" (
          "Id" uuid PRIMARY KEY,
          "TypeId" uuid NOT NULL REFERENCES "Opportunity"."OpportunityType" ("Id"),
          "Title" varchar(255) NOT NULL,
          "CredentialIssuanceEnabled" boolean NOT NULL,
          "SSISchemaName" varchar(255),
          "DateModified" timestamptz NOT NULL
        );

        CREATE TABLE "SSI"."CredentialIssuance" (
          "Id" uuid PRIMARY KEY,
          "Status" varchar(50) NOT NULL,
          "SchemaName" varchar(255) NOT NULL,
          "SchemaVersion" varchar(50)
        );

        INSERT INTO "SSI"."CredentialIssuance" VALUES
          (gen_random_uuid(), 'Pending', 'Opportunity|Default', NULL),
          (gen_random_uuid(), 'Error', 'Opportunity|Default', NULL),
          (gen_random_uuid(), 'Issued', 'Opportunity|Default', '1.0');
        """, connection, transaction))
        await fixture.ExecuteNonQueryAsync(cancellationToken);

      var originalDate = DateTimeOffset.UtcNow.AddDays(-1);
      foreach (var type in Enum.GetValues<Domain.Opportunity.Type>())
      {
        await using var insert = new NpgsqlCommand("""
          INSERT INTO "Opportunity"."OpportunityType" VALUES (@typeId, @type);

          INSERT INTO "Opportunity"."Opportunity" VALUES
            (gen_random_uuid(), @typeId, 'Generic enabled', true, 'Opportunity|Default', @date),
            (gen_random_uuid(), @typeId, 'Case variant enabled', true, ' opportunity|default ', @date),
            (gen_random_uuid(), @typeId, 'Generic disabled', false, 'Opportunity|Default', @date),
            (gen_random_uuid(), @typeId, 'Custom enabled', true, 'Opportunity|Custom', @date),
            (gen_random_uuid(), @typeId, 'Already scoped', true, @scoped, @date),
            (gen_random_uuid(), @typeId, 'Missing enabled', true, NULL, @date);
          """, connection, transaction);
        insert.Parameters.AddWithValue("typeId", Guid.NewGuid());
        insert.Parameters.AddWithValue("type", type.ToString());
        insert.Parameters.AddWithValue("scoped", SSISSchemaHelper.ToDefaultFullName(type));
        insert.Parameters.AddWithValue("date", originalDate);
        await insert.ExecuteNonQueryAsync(cancellationToken);
      }

      await using (var apply = new NpgsqlCommand(AssignmentOperation().Sql, connection, transaction))
      {
        Assert.Equal(8, await apply.ExecuteNonQueryAsync(cancellationToken));
        Assert.Equal(0, await apply.ExecuteNonQueryAsync(cancellationToken));
      }

      await using (var read = new NpgsqlCommand("""
        SELECT t."Name", o."Title", o."SSISchemaName", o."DateModified"
        FROM "Opportunity"."Opportunity" o
        JOIN "Opportunity"."OpportunityType" t ON t."Id" = o."TypeId"
        """, connection, transaction))
      await using (var reader = await read.ExecuteReaderAsync(cancellationToken))
      {
        var count = 0;
        while (await reader.ReadAsync(cancellationToken))
        {
          count++;
          var type = Enum.Parse<Domain.Opportunity.Type>(reader.GetString(0));
          var title = reader.GetString(1);
          var scopedName = SSISSchemaHelper.ToDefaultFullName(type);
          var changed = scopedName != "Opportunity|Default"
            && title is "Generic enabled" or "Case variant enabled";
          var expectedName = title switch
          {
            "Generic enabled" or "Already scoped" => scopedName,
            "Case variant enabled" => changed ? scopedName : " opportunity|default ",
            "Generic disabled" => "Opportunity|Default",
            "Custom enabled" => "Opportunity|Custom",
            "Missing enabled" => null,
            _ => throw new NotSupportedException($"Fixture '{title}' is not supported")
          };
          Assert.Equal(expectedName, reader.IsDBNull(2) ? null : reader.GetString(2));
          var modified = reader.GetFieldValue<DateTimeOffset>(3);
          if (changed) Assert.True(modified > originalDate);
          else Assert.Equal(originalDate.UtcTicks / 10, modified.UtcTicks / 10);
        }
        Assert.Equal(36, count);
      }

      await using (var queues = new NpgsqlCommand("""
        SELECT "Status", "SchemaName", "SchemaVersion" FROM "SSI"."CredentialIssuance"
        """, connection, transaction))
      await using (var reader = await queues.ExecuteReaderAsync(cancellationToken))
      {
        var count = 0;
        while (await reader.ReadAsync(cancellationToken))
        {
          count++;
          Assert.Equal("Opportunity|Default", reader.GetString(1));
          Assert.Equal(reader.GetString(0) == "Issued" ? "1.0" : null,
            reader.IsDBNull(2) ? null : reader.GetString(2));
        }
        Assert.Equal(3, count);
      }

      await transaction.RollbackAsync(cancellationToken);
      await using var verify = new NpgsqlCommand("""SELECT to_regclass('"Opportunity"."Opportunity"') IS NULL""", connection);
      Assert.True((bool)(await verify.ExecuteScalarAsync(cancellationToken))!);
    }
    #endregion Tests

    #region Private Members
    private static SqlOperation AssignmentOperation()
    {
      return Assert.Single(new ApplicationDb_CF_Configuration().UpOperations.OfType<SqlOperation>(),
        operation => operation.Sql.Contains("SET \"SSISchemaName\"", StringComparison.Ordinal));
    }
    #endregion Private Members
  }
}
