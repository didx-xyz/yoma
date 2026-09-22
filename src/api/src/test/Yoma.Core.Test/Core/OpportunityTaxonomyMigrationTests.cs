using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Npgsql;
using Moq;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Caching.Memory;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Models.Lookups;
using Yoma.Core.Domain.Opportunity.Services.Lookups;
using Xunit;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.Core
{
  public class OpportunityTaxonomyMigrationTests
  {
    private static readonly (Guid Id, string Name)[] LegacyCategories =
    [
      (new Guid("2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950"), "Agriculture"),
      (new Guid("fa564c1c-591a-4a6d-8294-20165da8866b"), "Technology and Digitization"),
      (new Guid("c76786fd-fca9-4633-85b3-11e53486d708"), "Business and Entrepreneurship"),
      (new Guid("7afb66ad-164e-46a3-933f-a0bac1ca1923"), "Creative Industry and Arts"),
      (new Guid("6e6a5f23-6d2e-4f45-8b4d-5d9c9a6b1e71"), "Health and Care"),
      (new Guid("f36051c9-9057-4765-bc2f-9dee82ef60d6"), "Tourism and Hospitality"),
      (new Guid("89f4ab46-0767-494f-a18c-3037f698133a"), "Career and Personal Development"),
      (new Guid("d0d322ab-d1d7-44b6-94e8-7b85246aa42e"), "Environment and Climate"),
      (new Guid("1dc39a5d-e049-4cfe-b708-855fce97b86e"), "AI, Data and Analytics"),
      (new Guid("b89c5e91-9cbb-4a0e-991f-f987eebf9b70"), "Other")
    ];

    private static readonly (Guid Id, string Name, string Icon)[] ApprovedCategories =
    [
      (new Guid("2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950"), "Agriculture, Food, Environment and Climate", "AgricultureFoodEnvironmentAndClimate.svg"),
      (new Guid("fa564c1c-591a-4a6d-8294-20165da8866b"), "Technology, AI & Data", "TechnologyAIAndData.svg"),
      (new Guid("c76786fd-fca9-4633-85b3-11e53486d708"), "Business, Finance & Marketing", "BusinessFinanceAndMarketing.svg"),
      (new Guid("7afb66ad-164e-46a3-933f-a0bac1ca1923"), "Creative, Media & Design", "CreativeMediaAndDesign.svg"),
      (new Guid("6e6a5f23-6d2e-4f45-8b4d-5d9c9a6b1e71"), "Health, Safety & Wellbeing", "HealthSafetyAndWellbeing.svg"),
      (new Guid("f36051c9-9057-4765-bc2f-9dee82ef60d6"), "Hospitality & Tourism", "HospitalityAndTourism.svg"),
      (new Guid("89f4ab46-0767-494f-a18c-3037f698133a"), "Personal Development & Career Readiness", "PersonalDevelopmentAndCareerReadiness.svg"),
      (new Guid("15ba04a2-5b3d-4d40-aa20-62ea38c9769a"), "Engineering, Science & Mathematics", "EngineeringScienceAndMathematics.svg"),
      (new Guid("45a18936-5965-4ffe-b12e-beeb81a40f34"), "Beauty & Personal Care", "BeautyAndPersonalCare.svg"),
      (new Guid("be1c903e-87bb-41cd-8da4-1f2f286d7dc9"), "Languages & Communication", "LanguagesAndCommunication.svg"),
      (new Guid("1612eb90-806b-40db-bc6e-a428780581dc"), "History, Society & Human Rights", "HistorySocietyAndHumanRights.svg"),
      (new Guid("0529387f-b8fe-4166-ba03-54293370197f"), "Office, Admin & Professional Skills", "OfficeAdminAndProfessionalSkills.svg"),
      (new Guid("1e8e59ae-4009-48ef-8c09-a72d6af068c7"), "Education & Teaching", "EducationAndTeaching.svg"),
      (new Guid("944c4b9a-8dc8-4e18-8913-2a01461a4f9b"), "Law, Governance & Compliance", "LawGovernanceAndCompliance.svg"),
      (new Guid("8a1778eb-0cd3-434c-bfb6-15788fd0b678"), "Retail & Food Services", "RetailAndFoodServices.svg"),
      (new Guid("b89c5e91-9cbb-4a0e-991f-f987eebf9b70"), "Other", "Other.svg")
    ];

    [Theory]
    [InlineData(typeof(Infrastructure.Alison.Client.AlisonClient), "Categories_Map")]
    [InlineData(typeof(Infrastructure.Jobberman.Client.JobbermanClient), "JobbermanCategoryMappings")]
    [InlineData(typeof(Infrastructure.JobJack.Client.JobJackClient), "CategoryMappings")]
    [InlineData(typeof(Infrastructure.IXO.PartnerSync.Client.IXOClient), "CategoryMappings")]
    [InlineData(typeof(Infrastructure.Umuzi.Client.UmuziClient), "CategoryMappings")]
    public void PartnerMappingsTargetApprovedCategoriesWithoutAmbiguousAliases(Type client, string fieldName)
    {
      var mappings = GetPartnerMappings(client, fieldName);
      Assert.NotEmpty(mappings);
      Assert.All(mappings.Keys, id => Assert.Contains(ApprovedCategories, category => category.Id == id));

      // Alison keeps slash-specific overrides; other partners normalize their source labels.
      var normalize = client.GetMethod("NormalizeLookupKey", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
      var aliases = mappings.SelectMany(mapping => mapping.Value.Select(value => new
      {
        Key = normalize == null ? value.Trim() : (string?)normalize.Invoke(null, [value]),
        Id = mapping.Key
      }));
      foreach (var group in aliases.GroupBy(alias => alias.Key, StringComparer.OrdinalIgnoreCase))
        Assert.Single(group.Select(alias => alias.Id).Distinct());
    }

    [Theory]
    [InlineData(typeof(Infrastructure.Alison.Client.AlisonClient), "Categories_Map", "education", "1e8e59ae-4009-48ef-8c09-a72d6af068c7")]
    [InlineData(typeof(Infrastructure.Alison.Client.AlisonClient), "Categories_Map", "education/climate-change", "2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950")]
    [InlineData(typeof(Infrastructure.Alison.Client.AlisonClient), "Categories_Map", "data-science", "fa564c1c-591a-4a6d-8294-20165da8866b")]
    [InlineData(typeof(Infrastructure.Jobberman.Client.JobbermanClient), "JobbermanCategoryMappings", "Legal Services", "944c4b9a-8dc8-4e18-8913-2a01461a4f9b")]
    [InlineData(typeof(Infrastructure.Jobberman.Client.JobbermanClient), "JobbermanCategoryMappings", "Food Services & Catering", "8a1778eb-0cd3-434c-bfb6-15788fd0b678")]
    [InlineData(typeof(Infrastructure.JobJack.Client.JobJackClient), "CategoryMappings", "Restaurant", "8a1778eb-0cd3-434c-bfb6-15788fd0b678")]
    [InlineData(typeof(Infrastructure.IXO.PartnerSync.Client.IXOClient), "CategoryMappings", "Education", "1e8e59ae-4009-48ef-8c09-a72d6af068c7")]
    [InlineData(typeof(Infrastructure.Umuzi.Client.UmuziClient), "CategoryMappings", "Environment and Climate", "2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950")]
    [InlineData(typeof(Infrastructure.Umuzi.Client.UmuziClient), "CategoryMappings", "AI, Data and Analytics", "fa564c1c-591a-4a6d-8294-20165da8866b")]
    public void PartnerVocabularyMapsToFinalTaxonomy(Type client, string fieldName, string source, string expectedId)
    {
      var mapping = Assert.Single(GetPartnerMappings(client, fieldName), mapping => mapping.Value.Contains(source));
      Assert.Equal(Guid.Parse(expectedId), mapping.Key);
    }

    [Theory]
    [InlineData(" EDUCATION ", "1e8e59ae-4009-48ef-8c09-a72d6af068c7")]
    [InlineData("education/climate-change", "2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950")]
    [InlineData("engineering/renewable-energy", "2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950")]
    [InlineData("engineering/new-course", "15ba04a2-5b3d-4d40-aa20-62ea38c9769a")]
    [InlineData("language/new-course", "be1c903e-87bb-41cd-8da4-1f2f286d7dc9")]
    [InlineData("unrecognized-category", null)]
    [InlineData(null, null)]
    public void AlisonPreservesExactOverrideRootFallbackAndUnknownHandling(string? source, string? expectedId)
    {
      var method = typeof(Infrastructure.Alison.Client.AlisonClient).GetMethod("TryResolveYomaCategoryId",
        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
      Assert.NotNull(method);
      object?[] arguments = [source, Guid.Empty];
      var resolved = Assert.IsType<bool>(method.Invoke(null, arguments));
      Assert.Equal(expectedId != null, resolved);
      Assert.Equal(expectedId == null ? Guid.Empty : Guid.Parse(expectedId), arguments[1]);
    }

    private static Dictionary<Guid, string[]> GetPartnerMappings(Type client, string fieldName)
    {
      var field = client.GetField(fieldName, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
      Assert.NotNull(field);
      return Assert.IsType<Dictionary<Guid, string[]>>(field.GetValue(null));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void CategoryLookupAlwaysSortsOtherLast(bool cacheEnabled)
    {
      var repository = new Mock<IRepository<OpportunityCategory>>();
      repository.Setup(value => value.Query()).Returns(new List<OpportunityCategory>
      {
        new() { Name = "Other" },
        new() { Name = "Technology, AI & Data" },
        new() { Name = "Agriculture, Food, Environment and Climate" }
      }.AsQueryable());
      using var cache = new MemoryCache(new MemoryCacheOptions());
      var service = new OpportunityCategoryService(Options.Create(new AppSettings
      {
        CacheEnabledByCacheItemTypes = cacheEnabled ? "Lookups" : "",
        CacheSlidingExpirationInHours = 1,
        CacheAbsoluteExpirationRelativeToNowInDays = 1
      }), cache, repository.Object);

      // Exercise both the initial load and a cache hit (or a second uncached read).
      for (var i = 0; i < 2; i++)
        Assert.Equal(
          ["Agriculture, Food, Environment and Climate", "Technology, AI & Data", "Other"],
          service.List().Select(category => category.Name));
      repository.Verify(value => value.Query(), Times.Exactly(cacheEnabled ? 1 : 2));
    }

    [Fact]
    public void UsesTransactionalSeedersAndPreservesRetainedIds()
    {
      var migration = new ApplicationDb_CF_Configuration();
      Assert.Equal(7, migration.UpOperations.OfType<UpdateDataOperation>().Count());
      var additions = Assert.Single(migration.UpOperations.OfType<InsertDataOperation>());
      Assert.Equal(8, additions.Values.GetLength(0));
      Assert.All(migration.UpOperations.OfType<SqlOperation>(), operation => Assert.False(operation.SuppressTransaction));
      Assert.Throws<NotSupportedException>(() => migration.DownOperations);
    }

    [Fact]
    public async Task MigratesAllLegacyCategoryCombinationsWithoutLosingSelections()
    {
      await using var connection = await OpenTestConnection();
      await using var transaction = await connection.BeginTransactionAsync(TestContext.Current.CancellationToken);
      await CreateFixture(connection, transaction);

      await Execute(connection, transaction, """
        INSERT INTO "Opportunity"."Opportunity" ("Id")
        SELECT ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid
        FROM generate_series(0, 1023) i;
        """);

      for (var bit = 0; bit < LegacyCategories.Length; bit++)
      {
        await Execute(connection, transaction, $"""
          INSERT INTO "Opportunity"."OpportunityCategories" ("Id", "OpportunityId", "CategoryId", "DateCreated")
          SELECT gen_random_uuid(), ('00000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
                 '{LegacyCategories[bit].Id}'::uuid, '2020-01-01Z'::timestamptz
          FROM generate_series(0, 1023) i WHERE (i & {1 << bit}) <> 0;
          """);
      }

      var original = await ReadLinks(connection, transaction);
      await ApplyMigration(connection, transaction);
      var migrated = await ReadLinks(connection, transaction);

      for (var combination = 0; combination < 1024; combination++)
      {
        var opportunityId = Guid.Parse($"00000000-0000-0000-0000-{combination:D12}");
        var expected = LegacyCategories.Where((_, bit) => (combination & (1 << bit)) != 0)
          .Select(category => TargetId(category.Id)).ToHashSet();
        if (expected.Count == 0) expected.Add(LegacyCategories[9].Id);
        var actual = migrated.Where(link => link.OpportunityId == opportunityId).ToList();
        Assert.Equal(expected.Order(), actual.Select(link => link.CategoryId).Order());
        foreach (var link in actual.Where(_ => combination != 0))
        {
          var retained = original.FirstOrDefault(candidate =>
            candidate.OpportunityId == opportunityId && candidate.CategoryId == link.CategoryId);
          var source = retained ?? original.Single(candidate =>
            candidate.OpportunityId == opportunityId && TargetId(candidate.CategoryId) == link.CategoryId);
          Assert.Equal(source.Id, link.Id);
          Assert.Equal(source.DateCreated, link.DateCreated);
        }
      }

      await using var command = new NpgsqlCommand("""
        SELECT "Id", "Name", "ImageURL", "DateCreated" FROM "Opportunity"."OpportunityCategory"
        """, connection, transaction);
      await using var reader = await command.ExecuteReaderAsync(TestContext.Current.CancellationToken);
      var count = 0;
      List<OpportunityCategory> lookupItems = [];
      while (await reader.ReadAsync(TestContext.Current.CancellationToken))
      {
        count++;
        var id = reader.GetGuid(0);
        var name = reader.GetString(1);
        var image = reader.GetString(2);
        var (Id, Name, Icon) = Assert.Single(ApprovedCategories, category => category.Id == id);
        Assert.Equal(Name, name);
        Assert.EndsWith("/" + Icon, image);
        lookupItems.Add(new OpportunityCategory { Id = id, Name = name, ImageURL = image });
        if (LegacyCategories.Any(category => category.Id == id))
          Assert.Equal(new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc), reader.GetDateTime(3));
        if (name == "Other") Assert.Equal("original/Other.svg", image);
        else Assert.StartsWith("https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/", image);
        Assert.DoesNotContain(LegacyCategories.Where(category => category.Name != "Other"), category => category.Name == name);
      }
      Assert.Equal(16, count);
      // CSV import uses this exact name resolver. Final names (case/whitespace tolerant) work;
      // legacy names are not aliases. Exports project these same current lookup names.
      var repository = new Mock<IRepository<OpportunityCategory>>();
      repository.Setup(value => value.Query()).Returns(lookupItems.AsQueryable());
      var service = new OpportunityCategoryService(Options.Create(new AppSettings
      {
        CacheEnabledByCacheItemTypes = ""
      }), Mock.Of<IMemoryCache>(), repository.Object);
      foreach (var (Id, Name, Icon) in ApprovedCategories)
        Assert.Equal(Id, service.GetByName(" " + Name.ToLowerInvariant() + " ").Id);
      foreach (var (_, name) in LegacyCategories.Where(category => category.Name != "Other"))
        Assert.Throws<ArgumentException>(() => service.GetByName(name));
      // Transaction disposal rolls back the isolated fixture and migration, including table creation.
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task UnexpectedLegacyDataFailsWithoutPartialChanges(bool additionalCategory)
    {
      await using var connection = await OpenTestConnection();
      await using var transaction = await connection.BeginTransactionAsync(TestContext.Current.CancellationToken);
      await CreateFixture(connection, transaction);
      await Execute(connection, transaction, additionalCategory
        ? """INSERT INTO "Opportunity"."OpportunityCategory" VALUES (gen_random_uuid(), 'Unexpected', 'unexpected.svg', CURRENT_TIMESTAMP)"""
        : """UPDATE "Opportunity"."OpportunityCategory" SET "Name" = 'Unexpected' WHERE "Name" = 'Agriculture'""");
      await transaction.SaveAsync("before_migration", TestContext.Current.CancellationToken);
      var exception = await Assert.ThrowsAsync<PostgresException>(() => ApplyMigration(connection, transaction));
      Assert.Contains("requires the ten approved legacy", exception.MessageText);
      await transaction.RollbackAsync("before_migration", TestContext.Current.CancellationToken);
      await using var command = new NpgsqlCommand("""SELECT COUNT(*) FROM "Opportunity"."OpportunityCategory" WHERE "Name" = 'Technology and Digitization'""", connection, transaction);
      Assert.Equal(1L, await command.ExecuteScalarAsync(TestContext.Current.CancellationToken));
    }

    private static Guid TargetId(Guid id) => id == LegacyCategories[7].Id ? LegacyCategories[0].Id
      : id == LegacyCategories[8].Id ? LegacyCategories[1].Id : id;

    [Fact]
    public async Task SeedsFinalTaxonomyWhenNoOpportunitiesExist()
    {
      await using var connection = await OpenTestConnection();
      await using var transaction = await connection.BeginTransactionAsync(TestContext.Current.CancellationToken);
      await CreateFixture(connection, transaction);
      await ApplyMigration(connection, transaction);
      Assert.Empty(await ReadLinks(connection, transaction));
      await using var command = new NpgsqlCommand(
        """SELECT COUNT(*) FROM "Opportunity"."OpportunityCategory" """, connection, transaction);
      Assert.Equal(16L, await command.ExecuteScalarAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task FailureDuringLinkMigrationRollsBackLookupChangesToo()
    {
      await using var connection = await OpenTestConnection();
      await using var transaction = await connection.BeginTransactionAsync(TestContext.Current.CancellationToken);
      await CreateFixture(connection, transaction);
      await Execute(connection, transaction, """
        INSERT INTO "Opportunity"."Opportunity" VALUES ('00000000-0000-0000-0000-000000000001');
        INSERT INTO "Opportunity"."OpportunityCategories" VALUES (
          gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
          'd0d322ab-d1d7-44b6-94e8-7b85246aa42e', CURRENT_TIMESTAMP);
        ALTER TABLE "Opportunity"."OpportunityCategories" ADD CONSTRAINT injected_failure
          CHECK ("CategoryId" <> '2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950'::uuid);
        """);
      var original = await ReadLinks(connection, transaction);
      await transaction.SaveAsync("before_migration", TestContext.Current.CancellationToken);
      var exception = await Assert.ThrowsAsync<PostgresException>(() => ApplyMigration(connection, transaction));
      Assert.Equal(PostgresErrorCodes.CheckViolation, exception.SqlState);
      await transaction.RollbackAsync("before_migration", TestContext.Current.CancellationToken);
      Assert.Equal(original, await ReadLinks(connection, transaction));
      await using var command = new NpgsqlCommand(
        """SELECT "Name" FROM "Opportunity"."OpportunityCategory" ORDER BY "Name" """, connection, transaction);
      await using var reader = await command.ExecuteReaderAsync(TestContext.Current.CancellationToken);
      List<string> names = [];
      while (await reader.ReadAsync(TestContext.Current.CancellationToken)) names.Add(reader.GetString(0));
      Assert.Equal(LegacyCategories.Select(category => category.Name).Order(), names.Order());
    }

    private static async Task<NpgsqlConnection> OpenTestConnection()
    {
      var value = Environment.GetEnvironmentVariable("YOMA_TAXONOMY_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrWhiteSpace(value), "Set YOMA_TAXONOMY_TEST_CONNECTION to an isolated local yoma_taxonomy_test_* database.");
      var builder = new NpgsqlConnectionStringBuilder(value);
      if (builder.Host is not ("localhost" or "127.0.0.1") ||
          builder.Database?.StartsWith("yoma_taxonomy_test_", StringComparison.Ordinal) != true)
        throw new InvalidOperationException("Taxonomy tests require an isolated local yoma_taxonomy_test_* database.");
      var connection = new NpgsqlConnection(builder.ConnectionString);
      await connection.OpenAsync();
      return connection;
    }

    private static async Task CreateFixture(NpgsqlConnection connection, NpgsqlTransaction transaction)
    {
      await Execute(connection, transaction, """
        CREATE SCHEMA "Opportunity";
        CREATE TABLE "Opportunity"."Opportunity" ("Id" uuid PRIMARY KEY);
        CREATE TABLE "Opportunity"."OpportunityCategory" (
          "Id" uuid PRIMARY KEY, "Name" varchar(125) NOT NULL UNIQUE,
          "ImageURL" varchar(2048) NOT NULL, "DateCreated" timestamptz NOT NULL);
        CREATE TABLE "Opportunity"."OpportunityCategories" (
          "Id" uuid PRIMARY KEY, "OpportunityId" uuid NOT NULL REFERENCES "Opportunity"."Opportunity"("Id"),
          "CategoryId" uuid NOT NULL REFERENCES "Opportunity"."OpportunityCategory"("Id"),
          "DateCreated" timestamptz NOT NULL, UNIQUE ("OpportunityId", "CategoryId"));
        """);
      foreach (var (id, name) in LegacyCategories)
      {
        await using var command = new NpgsqlCommand("""
          INSERT INTO "Opportunity"."OpportunityCategory" VALUES (@id, @name, @image, '2020-01-01Z'::timestamptz)
          """, connection, transaction);
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("name", name);
        command.Parameters.AddWithValue("image", $"original/{name}.svg");
        await command.ExecuteNonQueryAsync();
      }
    }

    private static async Task ApplyMigration(NpgsqlConnection connection, NpgsqlTransaction transaction)
    {
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(connection.ConnectionString).Options);
      var commands = context.GetService<IMigrationsSqlGenerator>().Generate(
        new ApplicationDb_CF_Configuration().UpOperations, context.GetService<IDesignTimeModel>().Model);
      foreach (var command in commands)
        await Execute(connection, transaction, command.CommandText);
    }

    private static async Task Execute(NpgsqlConnection connection, NpgsqlTransaction transaction, string sql)
    {
      await using var command = new NpgsqlCommand(sql, connection, transaction);
      await command.ExecuteNonQueryAsync();
    }

    private sealed record Link(Guid Id, Guid OpportunityId, Guid CategoryId, DateTime DateCreated);

    private static async Task<List<Link>> ReadLinks(NpgsqlConnection connection, NpgsqlTransaction transaction)
    {
      await using var command = new NpgsqlCommand("""
        SELECT "Id", "OpportunityId", "CategoryId", "DateCreated" FROM "Opportunity"."OpportunityCategories"
        """, connection, transaction);
      await using var reader = await command.ExecuteReaderAsync();
      List<Link> result = [];
      while (await reader.ReadAsync())
        result.Add(new Link(reader.GetGuid(0), reader.GetGuid(1), reader.GetGuid(2), reader.GetDateTime(3)));
      return result;
    }
  }
}
