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
using Yoma.Core.Domain.Core.Extensions;
using Xunit;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.Core
{
  public class OpportunityTaxonomyMigrationTests
  {
    [Fact]
    public void SpecialLookupEnumsMatchPersistedSeedNames()
    {
      var seeds = new ApplicationDb_CF_Configuration().UpOperations.OfType<InsertDataOperation>().ToList();
      var accessibility = Assert.Single(seeds, o => o.Schema == "Lookup" && o.Table == "Accessibility");
      var targetedGroups = Assert.Single(seeds, o => o.Schema == "Lookup" && o.Table == "TargetedGroup");

      Assert.Contains(Domain.Core.AccessibilityOption.Other.ToString(), accessibility.Values.Cast<object>());
      Assert.Contains(Domain.Core.TargetedGroupOption.OpenToAll.ToDescription(), targetedGroups.Values.Cast<object>());
    }

    [Fact]
    public void PayoutCurrencyUsesSeededLookupCodeWithoutChangingStoredValues()
    {
      var operations = new ApplicationDb_CF_Configuration().UpOperations.ToList();
      var foreignKey = Assert.Single(operations.OfType<AddForeignKeyOperation>(),
        item => item.Schema == "Payout" && item.Table == "Transaction" && item.Columns.Contains("Currency"));
      Assert.Equal("Lookup", foreignKey.PrincipalSchema);
      Assert.Equal("Currency", foreignKey.PrincipalTable);
      Assert.Equal("Code", Assert.Single(foreignKey.PrincipalColumns!));
      Assert.Equal(Microsoft.EntityFrameworkCore.Migrations.ReferentialAction.NoAction, foreignKey.OnDelete);

      var seed = Assert.Single(operations.OfType<InsertDataOperation>(),
        item => item.Schema == "Lookup" && item.Table == "Currency");
      Assert.True(operations.IndexOf(seed) < operations.IndexOf(foreignKey));
      Assert.Contains(seed.Values.Cast<object>(), value => Equals(value, "USD"));

      var column = Assert.Single(operations.OfType<AlterColumnOperation>(),
        item => item.Schema == "Payout" && item.Table == "Transaction" && item.Name == "Currency");
      Assert.Equal("varchar(3)", column.ColumnType);
      Assert.False(column.IsNullable);
      Assert.Equal("varchar(10)", column.OldColumn.ColumnType);
      Assert.Contains(operations.OfType<CreateIndexOperation>(), item =>
        item.Schema == "Payout" && item.Table == "Transaction" && item.Columns.SequenceEqual(new[] { "Currency" }));
    }

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
      var typeColumn = Assert.Single(migration.UpOperations.OfType<AddColumnOperation>(),
        item => item.Table == "UserSkills" && item.Name == "Type");
      Assert.Equal("Verified", typeColumn.DefaultValue);
      var dateModifiedColumn = Assert.Single(migration.UpOperations.OfType<AddColumnOperation>(),
        item => item.Table == "UserSkills" && item.Name == "DateModified");
      Assert.True(dateModifiedColumn.IsNullable);
      var dateModifiedNotNull = Assert.Single(migration.UpOperations.OfType<AlterColumnOperation>(),
        item => item.Table == "UserSkills" && item.Name == "DateModified");
      Assert.False(dateModifiedNotNull.IsNullable);
      Assert.Contains(migration.UpOperations.OfType<SqlOperation>(), item =>
        item.Sql.Contains("SET \"DateModified\" = \"DateCreated\"", StringComparison.Ordinal));
      var preferredCategories = Assert.Single(migration.UpOperations.OfType<CreateTableOperation>(),
        item => item.Name == "UserPreferenceCategories" && item.Schema == "Entity");
      Assert.Contains(preferredCategories.ForeignKeys, item =>
        item.PrincipalTable == "UserPreferences" && item.PrincipalSchema == "Entity");
      Assert.Contains(preferredCategories.ForeignKeys, item =>
        item.PrincipalTable == "OpportunityCategory" && item.PrincipalSchema == "Opportunity");
      Assert.Contains(migration.UpOperations.OfType<CreateIndexOperation>(), item =>
        item.Table == "UserPreferenceCategories" && item.IsUnique &&
        item.Columns.SequenceEqual(["UserId", "CategoryId"]));
      var updates = migration.UpOperations.OfType<UpdateDataOperation>().ToList();
      Assert.Equal(12, updates.Count(item => item.Schema != "SSI"));

      var systemType = Assert.Single(updates, item =>
        item.Schema == "SSI" && item.Table == "SchemaEntityProperty" && item.Columns.Contains("SystemType"));
      Assert.Equal("Id", Assert.Single(systemType.KeyColumns));
      Assert.Equal(Guid.Parse("755B1F54-1365-4D2F-AF29-8AEC57CC7B4C"),
        Guid.Parse(systemType.KeyValues[0, 0]!.ToString()!));
      Assert.Equal("SystemType", Assert.Single(systemType.Columns));
      Assert.Equal(Domain.SSI.SchemaEntityPropertySystemType.OpportunityType.ToString(), systemType.Values[0, 0]);

      var legacyDifficulty = Assert.Single(updates, item =>
        item.Schema == "SSI" && item.Table == "SchemaEntityProperty" && item.Columns.Contains("Required"));
      Assert.Equal("Id", Assert.Single(legacyDifficulty.KeyColumns));
      Assert.Equal(Guid.Parse("FF423D0C-2E91-48A6-9245-28EEF6E96B01"),
        Guid.Parse(legacyDifficulty.KeyValues[0, 0]!.ToString()!));
      Assert.Equal("Required", Assert.Single(legacyDifficulty.Columns));
      Assert.Equal(false, legacyDifficulty.Values[0, 0]);
      Assert.Equal(2, updates.Count(item => item.Schema == "SSI"));

      var engagementRenames = migration.UpOperations.OfType<UpdateDataOperation>()
        .Where(item => item.Table == "EngagementType" && item.Schema == "Lookup").ToList();
      Assert.Equal(3, engagementRenames.Count);
      Assert.Contains(engagementRenames, item => item.KeyValues[0, 0]?.ToString()?.Equals(
        "0B2AAF7A-FDCF-4015-9668-D06BDEBAFA09", StringComparison.OrdinalIgnoreCase) == true &&
        item.Values[0, 0]?.ToString() == "Remote");
      Assert.Contains(engagementRenames, item => item.KeyValues[0, 0]?.ToString()?.Equals(
        "171A5E0A-B4DB-49F1-A03E-96B5975650A7", StringComparison.OrdinalIgnoreCase) == true &&
        item.Values[0, 0]?.ToString() == "OnSite" && item.Values[0, 1]?.ToString() == "On-site");
      Assert.Contains(migration.UpOperations.OfType<AddColumnOperation>(), item =>
        item.Table == "EngagementType" && item.Schema == "Lookup" && item.Name == "DisplayName");
      var preferences = Assert.Single(migration.UpOperations.OfType<CreateTableOperation>(), item =>
        item.Name == "UserPreferences" && item.Schema == "Entity");
      Assert.Contains(preferences.Columns, item => item.Name == "Incentivized" && item.ClrType == typeof(bool) && item.IsNullable);
      Assert.Contains(preferences.Columns, item => item.Name == "EngagementTypeId" && item.IsNullable);
      Assert.Contains(preferences.ForeignKeys, item => item.PrincipalTable == "User" && item.PrincipalSchema == "Entity");
      Assert.Contains(preferences.ForeignKeys, item => item.PrincipalTable == "EngagementType" && item.PrincipalSchema == "Lookup");
      var additions = migration.UpOperations.OfType<InsertDataOperation>().ToList();
      Assert.Equal(8, Assert.Single(additions, item => item.Table == "OpportunityCategory").Values.GetLength(0));
      Assert.Equal(6, Assert.Single(additions, item => item.Table == "Education").Values.GetLength(0));
      Assert.Equal(5, Assert.Single(additions, item => item.Table == "UserGoal").Values.GetLength(0));
      Assert.Contains(preferences.Columns, item => item.Name == "GoalId" && item.IsNullable);
      Assert.Contains(preferences.ForeignKeys, item => item.PrincipalTable == "UserGoal" && item.PrincipalSchema == "Entity");
      Assert.Contains(preferences.Columns, item => item.Name == "CommitmentIntervalId" && item.IsNullable);
      Assert.Contains(preferences.Columns, item => item.Name == "CommitmentIntervalCount" && item.IsNullable && item.ColumnType == "smallint");
      Assert.Contains(preferences.ForeignKeys, item => item.PrincipalTable == "TimeInterval" && item.PrincipalSchema == "Lookup");
      Assert.Equal(16, Assert.Single(additions, item => item.Table == "Accessibility").Values.GetLength(0));
      var accessibilityRequirements = Assert.Single(migration.UpOperations.OfType<CreateTableOperation>(), item =>
        item.Name == "UserPreferenceAccessibilityRequirements" && item.Schema == "Entity");
      Assert.Contains(accessibilityRequirements.ForeignKeys, item =>
        item.PrincipalTable == "UserPreferences" && item.PrincipalSchema == "Entity");
      Assert.Contains(accessibilityRequirements.ForeignKeys, item =>
        item.PrincipalTable == "Accessibility" && item.PrincipalSchema == "Lookup");
      Assert.Contains(migration.UpOperations.OfType<CreateIndexOperation>(), item =>
        item.Table == "UserPreferenceAccessibilityRequirements" && item.IsUnique &&
        item.Columns.SequenceEqual(["UserId", "AccessibilityId"]));
      Assert.Contains(preferences.Columns, item => item.Name == "AccessibilityRequirementOtherDescription" && item.IsNullable &&
        item.ColumnType == "varchar(500)");
      var languages = Assert.Single(migration.UpOperations.OfType<CreateTableOperation>(), item =>
        item.Name == "UserPreferenceLanguages" && item.Schema == "Entity");
      Assert.Contains(languages.ForeignKeys, item => item.PrincipalTable == "UserPreferences" && item.PrincipalSchema == "Entity");
      Assert.Contains(languages.ForeignKeys, item => item.PrincipalTable == "Language" && item.PrincipalSchema == "Lookup");
      Assert.Contains(migration.UpOperations.OfType<CreateIndexOperation>(), item =>
        item.Table == "UserPreferenceLanguages" && item.IsUnique && item.Columns.SequenceEqual(["UserId", "LanguageId"]));
      Assert.All(migration.UpOperations.OfType<SqlOperation>(), operation => Assert.False(operation.SuppressTransaction));
      Assert.Throws<NotSupportedException>(() => migration.DownOperations);
    }

    [Fact]
    public void ImpactActionEnumAndLookupUseNameAndDescription()
    {
      var id = Guid.NewGuid();
      var repository = new Mock<IRepository<OpportunityType>>();
      repository.Setup(item => item.Query()).Returns(new List<OpportunityType>
      {
        new() { Id = id, Name = "ImpactAction", DisplayName = "Impact Action" }
      }.AsQueryable());
      var service = new OpportunityTypeService(Options.Create(new AppSettings
      {
        CacheEnabledByCacheItemTypes = ""
      }), Mock.Of<IMemoryCache>(), repository.Object);

      Assert.Equal(id, service.GetByName(Domain.Opportunity.Type.ImpactAction.ToString()).Id);
      Assert.Equal("Impact Action", Domain.Opportunity.Type.ImpactAction.ToDescription());
    }

    [Fact]
    public void IXOImpactActionMapsToRenamedOpportunityType()
    {
      var parse = typeof(Infrastructure.IXO.PartnerSync.Client.IXOClient).GetMethod("ParseOpportunityType",
        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
      Assert.NotNull(parse);
      Assert.Equal(Domain.Opportunity.Type.ImpactAction, parse.Invoke(null, ["Impact Action"]));
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

      await using (var skillCommand = new NpgsqlCommand("""
        SELECT "Type", "DateCreated", "DateModified" FROM "Entity"."UserSkills"
        """, connection, transaction))
      {
        await using var skillReader = await skillCommand.ExecuteReaderAsync(TestContext.Current.CancellationToken);
        Assert.True(await skillReader.ReadAsync(TestContext.Current.CancellationToken));
        Assert.Equal("Verified", skillReader.GetString(0));
        Assert.Equal(skillReader.GetFieldValue<DateTimeOffset>(1), skillReader.GetFieldValue<DateTimeOffset>(2));
      }

      await using (var nullableCommand = new NpgsqlCommand("""
        SELECT is_nullable FROM information_schema.columns
        WHERE table_schema = 'Entity' AND table_name = 'UserSkills' AND column_name = 'DateModified'
        """, connection, transaction))
      {
        Assert.Equal("NO", await nullableCommand.ExecuteScalarAsync(TestContext.Current.CancellationToken));
      }

      await using (var typeCommand = new NpgsqlCommand("""
        SELECT "Id", "Name", "DisplayName" FROM "Opportunity"."OpportunityType"
        WHERE "Id" = 'f12a9d90-a8f6-4914-8ca5-6acf209f7312'
        """, connection, transaction))
      await using (var typeReader = await typeCommand.ExecuteReaderAsync(TestContext.Current.CancellationToken))
      {
        Assert.True(await typeReader.ReadAsync(TestContext.Current.CancellationToken));
        Assert.Equal(new Guid("f12a9d90-a8f6-4914-8ca5-6acf209f7312"), typeReader.GetGuid(0));
        Assert.Equal("ImpactAction", typeReader.GetString(1));
        Assert.Equal("Impact Action", typeReader.GetString(2));
      }

      await using (var educationCommand = new NpgsqlCommand("""
        SELECT "Id", "Name" FROM "Lookup"."Education"
        """, connection, transaction))
      await using (var educationReader = await educationCommand.ExecuteReaderAsync(TestContext.Current.CancellationToken))
      {
        var values = new Dictionary<Guid, string>();
        while (await educationReader.ReadAsync(TestContext.Current.CancellationToken))
          values.Add(educationReader.GetGuid(0), educationReader.GetString(1));
        Assert.Equal(11, values.Count);
        Assert.Equal("Primary (Grade 1–7 or equivalent)", values[new Guid("BEEBEA3B-381E-4BD8-91D8-319089AB14DA")]);
        Assert.Equal("Secondary (Grade 8–12, Matric or equivalent)", values[new Guid("5642E521-34B9-4DC8-BFFA-B975F5C95D99")]);
        Assert.Equal("Tertiary (Qualification not specified)", values[new Guid("2C0F0175-7007-40BF-9BF9-6D15B793BC09")]);
        Assert.Equal("No formal education (No schooling attended)", values[new Guid("D306BEA3-04AA-4778-969F-4F92DA45559E")]);
        Assert.Equal("Other", values[new Guid("D0DDBF9F-6AF1-46BE-9465-BD6B8D47B752")]);
        Assert.Contains("Tertiary - Certificate", values.Values);
        Assert.Contains("Tertiary - Diploma", values.Values);
        Assert.Contains("Tertiary - Bachelor’s Degree", values.Values);
        Assert.Contains("Tertiary - Honours Degree", values.Values);
        Assert.Contains("Tertiary - Master’s Degree", values.Values);
        Assert.Contains("Tertiary - PhD", values.Values);
      }

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

    [Fact]
    public async Task ConfigurationMigrationPersistsAllFieldsWithOneGroupingLevel()
    {
      await using var connection = await OpenTestConnection();
      await using var transaction = await connection.BeginTransactionAsync(TestContext.Current.CancellationToken);
      await CreateFixture(connection, transaction);
      await ApplyMigration(connection, transaction);

      await using var command = new NpgsqlCommand("""
        SELECT
          COUNT(*),
          COUNT(*) FILTER (WHERE "SubGroup" IS NOT NULL),
          COUNT(*) FILTER (WHERE "Group" ILIKE '%details%'),
          COUNT(*) FILTER (WHERE "EntityContext" = 'Job' AND "Group" = 'Compensation'),
          COUNT(*) FILTER (WHERE "EntityContext" = 'Entrepreneurship' AND "Group" = 'Outcomes')
        FROM "Core"."CustomFieldDefinition";
        """, connection, transaction);
      await using var reader = await command.ExecuteReaderAsync(TestContext.Current.CancellationToken);

      Assert.True(await reader.ReadAsync(TestContext.Current.CancellationToken));
      Assert.Equal(39L, reader.GetInt64(0));
      Assert.Equal(0L, reader.GetInt64(1));
      Assert.Equal(0L, reader.GetInt64(2));
      Assert.Equal(5L, reader.GetInt64(3));
      Assert.Equal(7L, reader.GetInt64(4));
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
        CREATE SCHEMA "Lookup";
        CREATE SCHEMA "Entity";
        CREATE TABLE "Entity"."User" ("Id" uuid PRIMARY KEY);
        CREATE TABLE "Lookup"."TimeInterval" ("Id" uuid PRIMARY KEY);
        CREATE TABLE "Lookup"."Language" ("Id" uuid PRIMARY KEY);
        CREATE TABLE "Lookup"."EngagementType" (
          "Id" uuid PRIMARY KEY, "Name" varchar(125) NOT NULL);
        INSERT INTO "Lookup"."EngagementType" VALUES
          ('0b2aaf7a-fdcf-4015-9668-d06bdebafa09', 'Online'),
          ('171a5e0a-b4db-49f1-a03e-96b5975650a7', 'Offline'),
          ('6c0405a9-87b6-4834-9068-a928ceecf85b', 'Hybrid');
        CREATE TABLE "Entity"."UserSkills" ("Id" uuid PRIMARY KEY, "DateCreated" timestamptz NOT NULL);
        INSERT INTO "Entity"."UserSkills" VALUES (gen_random_uuid(), '2024-01-15T12:00:00Z'::timestamptz);
        CREATE TABLE "Lookup"."Education" (
          "Id" uuid PRIMARY KEY, "Name" varchar(125) NOT NULL UNIQUE,
          "DateCreated" timestamptz NOT NULL);
        INSERT INTO "Lookup"."Education" VALUES
          ('BEEBEA3B-381E-4BD8-91D8-319089AB14DA', 'Primary (Grade 1–7 or equivalent)', CURRENT_TIMESTAMP),
          ('5642E521-34B9-4DC8-BFFA-B975F5C95D99', 'Secondary (Grade 8–12, Matric or equivalent)', CURRENT_TIMESTAMP),
          ('2C0F0175-7007-40BF-9BF9-6D15B793BC09', 'Tertiary (Diploma, Degree or equivalent)', CURRENT_TIMESTAMP),
          ('D306BEA3-04AA-4778-969F-4F92DA45559E', 'No formal education (No schooling attended)', CURRENT_TIMESTAMP),
          ('D0DDBF9F-6AF1-46BE-9465-BD6B8D47B752', 'Other', CURRENT_TIMESTAMP);
        CREATE SCHEMA "Opportunity";
        CREATE SCHEMA "Payout";
        CREATE TABLE "Payout"."Transaction" (
          "Id" uuid PRIMARY KEY, "Currency" varchar(10) NOT NULL);
        CREATE TABLE "Opportunity"."Opportunity" (
          "Id" uuid PRIMARY KEY, "TypeId" uuid NULL,
          "ZltoReward" numeric(8,2) NULL, "ZltoRewardPool" numeric(12,2) NULL,
          "DifficultyId" uuid NULL, "OrganizationId" uuid NULL,
          "CommitmentIntervalId" uuid NULL, "CommitmentIntervalCount" smallint NULL,
          "StatusId" uuid NULL, "Keywords" text NULL,
          "DateStart" timestamptz NULL, "DateEnd" timestamptz NULL,
          "CredentialIssuanceEnabled" boolean NULL, "SSISchemaName" varchar(255) NULL,
          "Featured" boolean NULL,
          "EngagementTypeId" uuid NULL, "ShareWithPartners" boolean NULL, "Hidden" boolean NULL,
          "DateCreated" timestamptz NULL, "CreatedByUserId" uuid NULL,
          "DateModified" timestamptz NULL, "ModifiedByUserId" uuid NULL);
        CREATE TABLE "Opportunity"."MyOpportunity" ("Id" uuid PRIMARY KEY);
        CREATE TABLE "Opportunity"."OpportunityDifficulty" (
          "Id" uuid PRIMARY KEY, "Name" varchar(125) NOT NULL);
        ALTER TABLE "Opportunity"."Opportunity"
          ADD CONSTRAINT "FK_Opportunity_OpportunityDifficulty_DifficultyId"
          FOREIGN KEY ("DifficultyId") REFERENCES "Opportunity"."OpportunityDifficulty" ("Id");
        CREATE INDEX "IX_Opportunity_DifficultyId" ON "Opportunity"."Opportunity" ("DifficultyId");
        CREATE INDEX "IX_Opportunity_TypeId_OrganizationId_ZltoReward_DifficultyId_C~"
          ON "Opportunity"."Opportunity" ("TypeId", "OrganizationId", "ZltoReward", "DifficultyId");
        CREATE TABLE "Opportunity"."OpportunityCountries" (
          "Id" uuid PRIMARY KEY, "DateCreated" timestamptz NOT NULL);
        CREATE TABLE "Opportunity"."OpportunityType" (
          "Id" uuid PRIMARY KEY, "Name" varchar(125) NOT NULL UNIQUE,
          "DisplayName" varchar(125) NOT NULL, "DateCreated" timestamptz NOT NULL);
        INSERT INTO "Opportunity"."OpportunityType" VALUES (
          'f12a9d90-a8f6-4914-8ca5-6acf209f7312', 'Task', 'Task', '2020-01-01Z'::timestamptz);
        CREATE TABLE "Opportunity"."OpportunityCategory" (
          "Id" uuid PRIMARY KEY, "Name" varchar(125) NOT NULL UNIQUE,
          "ImageURL" varchar(2048) NOT NULL, "DateCreated" timestamptz NOT NULL);
        CREATE TABLE "Opportunity"."OpportunityCategories" (
          "Id" uuid PRIMARY KEY, "OpportunityId" uuid NOT NULL REFERENCES "Opportunity"."Opportunity"("Id"),
          "CategoryId" uuid NOT NULL REFERENCES "Opportunity"."OpportunityCategory"("Id"),
          "DateCreated" timestamptz NOT NULL, UNIQUE ("OpportunityId", "CategoryId"));
        """);

      // The configuration migration now also seeds CFs. Reuse the real framework's
      // table definitions rather than duplicating every column in this taxonomy fixture.
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(connection.ConnectionString, options => options.UseNetTopologySuite()).Options);
      var frameworkTables = new ApplicationDb_Custom_Fields_Treasury_Payout_SSI().UpOperations
        .OfType<CreateTableOperation>().Where(o => o.Schema == "Core").ToList();
      await Execute(connection, transaction, "CREATE SCHEMA \"Core\";");
      var commands = context.GetService<IMigrationsSqlGenerator>()
        .Generate(frameworkTables, context.GetService<IDesignTimeModel>().Model);
      foreach (var command in commands)
        await Execute(connection, transaction, command.CommandText);
      await Execute(connection, transaction, """
        ALTER TABLE "Core"."CustomFieldDefinition"
          ADD COLUMN "IsSchemaMapped" boolean NOT NULL DEFAULT false;
        """);

      // SSI metadata is now part of CF configuration too. Build its existing catalogue from the
      // real migrations so the fixture tests the Type update and four additions against real rows.
      var initialOperations = new ApplicationDb_Initial().UpOperations;
      var schemaCatalogue = initialOperations.OfType<CreateTableOperation>()
        .Where(operation => operation.Schema == "SSI"
          && operation.Name is "SchemaEntity" or "SchemaEntityProperty")
        .Cast<MigrationOperation>()
        .Concat(initialOperations.OfType<InsertDataOperation>()
          .Where(operation => operation.Schema == "SSI"
            && operation.Table is "SchemaEntity" or "SchemaEntityProperty"))
        .Concat(new ApplicationDb_Custom_Fields_Treasury_Payout_SSI().UpOperations
          .OfType<AddColumnOperation>()
          .Where(operation => operation.Schema == "SSI" && operation.Table == "SchemaEntityProperty"))
        .ToList();
      await Execute(connection, transaction, "CREATE SCHEMA \"SSI\";");
      var catalogueCommands = context.GetService<IMigrationsSqlGenerator>()
        .Generate(schemaCatalogue, context.GetService<IDesignTimeModel>().Model);
      foreach (var command in catalogueCommands)
        await Execute(connection, transaction, command.CommandText);

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
        .UseNpgsql(connection.ConnectionString, options => options.UseNetTopologySuite()).Options);
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
