using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Opportunity.Repositories;
using Yoma.Core.Domain.Entity.Interfaces;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Validators;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Test.Core
{
  public class OpportunityCoreFieldsTests
  {
    private static readonly Guid JobId = Guid.NewGuid();
    private static readonly Guid AccommodationId = Guid.NewGuid();
    private static readonly Guid OtherId = Guid.NewGuid();
    private static readonly Guid OpenToAllId = Guid.NewGuid();

    [Fact]
    public void PublicOpportunitySearchSupportsCountOnlyWithoutPresetFlag()
    {
      var filter = new OpportunitySearchFilter { TotalCountOnly = true };
      var json = JsonConvert.SerializeObject(filter);

      Assert.Contains("\"TotalCountOnly\":true", json);
      Assert.DoesNotContain("ApplyUserPresets", json);
      Assert.True(JsonConvert.DeserializeObject<OpportunitySearchFilter>(json)!.TotalCountOnly);
    }

    [Theory]
    [InlineData(false, null, true)]
    [InlineData(false, "Large-print", false)]
    [InlineData(true, null, true)]
    [InlineData(true, "Large-print", true)]
    public void OtherDescriptionSearchRequiresOtherSelection(bool otherSelected, string? description, bool valid)
    {
      var accessibility = new Mock<IAccessibilityService>();
      accessibility.Setup(o => o.GetByIdOrNull(OtherId))
        .Returns(new Accessibility { Id = OtherId, Name = AccessibilityOption.Other.ToString() });

      var validator = new OpportunitySearchFilterValidator(
        new Domain.Core.Validators.CoordinatesValidator(), accessibility.Object);
      var filter = new OpportunitySearchFilterAdmin
      {
        Accommodations = otherSelected ? [OtherId] : [AccommodationId],
        AccommodationOtherDescription = description
      };

      var result = validator.Validate(filter, options =>
        options.IncludeProperties(o => o.AccommodationOtherDescription));

      Assert.Equal(valid, result.IsValid);
    }

    [Fact]
    public void OpenToAllCannotBeCombinedWithSpecificTargetedGroups()
    {
      var validator = CreateValidator();
      var request = new OpportunityRequestCreate { TargetedGroups = [OpenToAllId] };
      Assert.True(ValidateCore(validator, request).IsValid);

      request.TargetedGroups.Add(Guid.NewGuid());
      Assert.Contains(ValidateCore(validator, request).Errors,
        o => o.ErrorMessage == "Open to all cannot be combined with another targeted group.");
    }

    [Theory]
    [InlineData("OpportunityInfoCsvImport_Sample.csv", 5)]
    [InlineData("OpportunityInfoCsvImport_Sample_Jobs.csv", 4)]
    public void ApiCsvSamplesUseCanonicalCoreValues(string filename, int expectedCount)
    {
      var directory = new DirectoryInfo(AppContext.BaseDirectory);
      while (directory != null && !File.Exists(Path.Combine(directory.FullName, "other", filename)))
        directory = directory.Parent;
      Assert.NotNull(directory);

      using var reader = File.OpenText(Path.Combine(directory.FullName, "other", filename));
      using var csv = new CsvHelper.CsvReader(reader, new CsvHelper.Configuration.CsvConfiguration(System.Globalization.CultureInfo.InvariantCulture)
      {
        MissingFieldFound = null
      });
      var records = csv.GetRecords<OpportunityInfoCsvImport>().ToList();
      Assert.Equal(expectedCount, records.Count);
      Assert.All(records, o => Assert.NotNull(o.RewardType));
      Assert.All(records.Where(o => o.ZltoReward.HasValue), o => Assert.Equal(RewardType.ZLTO, o.RewardType));
      Assert.All(records.Where(o => o.Type == "Job"), o => Assert.Equal(RewardType.None, o.RewardType));
      Assert.Equal(2, records[0].SustainableDevelopmentGoals!.Count);
    }

    [Fact]
    public void FullResponseExportsSelectionsInImportFormatAndReferenceItemStaysLightweight()
    {
      var info = new OpportunityInfo
      {
        Provider = "Provider",
        Accommodations = [new Accessibility { Name = "Quiet workspace" }, new Accessibility { Name = "Other" }],
        SustainableDevelopmentGoals = [new SustainableDevelopmentGoal { Number = 4 }, new SustainableDevelopmentGoal { Number = 8 }]
      };
      Assert.Equal("Quiet workspace|Other", info.AccommodationsFlattened);
      Assert.Equal("4|8", info.SustainableDevelopmentGoalsFlattened);
      var json = Newtonsoft.Json.Linq.JObject.FromObject(info);
      Assert.Equal("Provider", (string?)json[nameof(info.Provider)]);
      Assert.Null(json[nameof(info.AccommodationsFlattened)]);
      Assert.Null(Newtonsoft.Json.Linq.JObject.FromObject(new OpportunityItem { ZltoReward = 25 })[nameof(OpportunityItem.ZltoReward)]);
    }

    [Fact]
    public async Task CoreMetadataRoundTripsAndFiltersInPostgreSql()
    {
      var connectionString = System.Environment.GetEnvironmentVariable("YOMA_CORE_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(connectionString), "Set YOMA_CORE_TEST_CONNECTION to a disposable migrated and locally seeded database.");
      var connection = new Npgsql.NpgsqlConnectionStringBuilder(connectionString);
      Assert.StartsWith("yoma_core_", connection.Database);
      Assert.True(connection.Host is "localhost" or "127.0.0.1");

      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(connectionString, options => options.UseNetTopologySuite()).Options);
      var cancellationToken = TestContext.Current.CancellationToken;
      await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
      var repository = new OpportunityRepository(context);
      var item = await repository.Query(true).FirstAsync(cancellationToken);
      item.Provider = "Core metadata test provider";
      item.Incentivized = true;
      item.RewardType = RewardType.PartnerIncentive;
      item.PartnerIncentiveAmount = 12.50m;
      item.PartnerIncentiveCurrency = "USD";
      item.ZltoReward = null;
      item.ZltoRewardPool = null;
      item.AccessibilitySupport = AccessibilitySupport.Yes;
      item.AgeFrom = 18;
      item.AgeTo = 25;
      await repository.Update(item);

      var accommodationId = await context.Accessibility.Select(o => o.Id).FirstAsync(cancellationToken);
      var groupId = await context.TargetedGroup.Select(o => o.Id).FirstAsync(cancellationToken);
      var goalId = await context.SustainableDevelopmentGoal.Select(o => o.Id).FirstAsync(cancellationToken);
      var accommodations = new OpportunityAccommodationRepository(context);
      var groups = new OpportunityTargetedGroupRepository(context);
      var goals = new OpportunitySustainableDevelopmentGoalRepository(context);
      var accommodation = await accommodations.Create(new OpportunityAccommodation { OpportunityId = item.Id, AccommodationId = accommodationId });
      await groups.Create(new OpportunityTargetedGroup { OpportunityId = item.Id, TargetedGroupId = groupId });
      await goals.Create(new OpportunitySustainableDevelopmentGoal { OpportunityId = item.Id, SustainableDevelopmentGoalId = goalId });

      var loaded = await repository.Query(true).SingleAsync(o => o.Id == item.Id, cancellationToken);
      Assert.Equal(item.Provider, loaded.Provider);
      Assert.Equal(12.50m, loaded.PartnerIncentiveAmount);
      Assert.Equal("USD", loaded.PartnerIncentiveCurrency);
      Assert.Equal(accommodationId, Assert.Single(loaded.Accommodations!).Id);
      Assert.Equal(groupId, Assert.Single(loaded.TargetedGroups!).Id);
      Assert.Equal(goalId, Assert.Single(loaded.SustainableDevelopmentGoals!).Id);

      var query = repository.Query(false).Where(o => o.Id == item.Id);
      query = repository.Contains(query, o => o.Provider, "metadata test");
      query = query.Where(o => o.Incentivized == true && o.RewardType == RewardType.PartnerIncentive &&
        o.AccessibilitySupport == AccessibilitySupport.Yes && o.AgeFrom <= 20 && o.AgeTo >= 20);
      var matchedIds = accommodations.Query().Where(o => o.AccommodationId == accommodationId).Select(o => o.OpportunityId);
      Assert.Single(await query.Where(o => matchedIds.Contains(o.Id)).ToListAsync(cancellationToken));
      Assert.Empty(await query.Where(o => o.AgeFrom <= 17).ToListAsync(cancellationToken));

      await accommodations.Delete(accommodation);
      Assert.Empty(await query.Where(o => matchedIds.Contains(o.Id)).ToListAsync(cancellationToken));
      Assert.Empty((await repository.Query(true).SingleAsync(o => o.Id == item.Id, cancellationToken)).Accommodations!);
      // The transaction is intentionally rolled back: this fixture never changes its seed data.
    }

    [Fact]
    public void ManualCaptureRequiresIncentivizedSelection()
    {
      var validator = CreateValidator();
      var request = new OpportunityRequestCreate();
      Assert.Contains(validator.Validate(request, o => o.IncludeRuleSets("Manual")).Errors, o => o.PropertyName == nameof(request.Incentivized));
      Assert.True(ValidateCore(validator, request).IsValid, ValidateCore(validator, request).ToString());
    }

    [Fact]
    public void JobsCannotOfferZltoButCanHaveSalaryWithoutAReward()
    {
      var request = new OpportunityRequestCreate { TypeId = JobId, Incentivized = true };
      var validator = CreateValidator();
      Assert.True(ValidateCore(validator, request).IsValid, ValidateCore(validator, request).ToString());

      request.RewardType = RewardType.ZLTO;
      request.ZltoReward = 10;
      Assert.Contains(ValidateCore(validator, request).Errors, o => o.ErrorMessage == "Jobs do not support ZLTO rewards.");
    }

    [Fact]
    public void PartnerIncentiveRequiresPositiveAmountAndRecognizedCurrency()
    {
      var request = new OpportunityRequestCreate { Incentivized = true, RewardType = RewardType.PartnerIncentive };
      var validator = CreateValidator();
      Assert.False(ValidateCore(validator, request).IsValid);

      request.PartnerIncentiveAmount = 12.50m;
      request.PartnerIncentiveCurrency = "USD";
      Assert.True(ValidateCore(validator, request).IsValid, ValidateCore(validator, request).ToString());

      request.Incentivized = false;
      Assert.False(ValidateCore(validator, request).IsValid);
    }

    [Fact]
    public void AccommodationsRequireSupportAndOtherRequiresDescription()
    {
      var request = new OpportunityRequestCreate { Accommodations = [AccommodationId] };
      var validator = CreateValidator();
      Assert.False(ValidateCore(validator, request).IsValid);

      request.AccessibilitySupport = AccessibilitySupport.Yes;
      Assert.True(ValidateCore(validator, request).IsValid, ValidateCore(validator, request).ToString());
      request.Accommodations = [OtherId];
      Assert.False(ValidateCore(validator, request).IsValid);
      request.AccommodationOtherDescription = "Large-print materials";
      Assert.True(ValidateCore(validator, request).IsValid, ValidateCore(validator, request).ToString());
      request.Accommodations = [AccommodationId];
      Assert.False(ValidateCore(validator, request).IsValid);
    }

    [Theory]
    [InlineData(18, true)]
    [InlineData(25, true)]
    [InlineData(17, false)]
    [InlineData(26, false)]
    public void AgeBoundsAreInclusive(int age, bool allowed)
    {
      var opportunity = new Opportunity { AgeFrom = 18, AgeTo = 25 };
      var birthDate = DateTimeOffset.UtcNow.Date.AddYears(-age).AddDays(-1);
      var exception = Record.Exception(() => opportunity.AssertAgeEligibility(birthDate));
      if (allowed) Assert.Null(exception);
      else Assert.IsType<ValidationException>(exception);
    }

    [Fact]
    public void UnknownAgeIsAllowedButPartnerSuppliedLimitsAreEnforced()
    {
      var opportunity = new Opportunity { AgeFrom = 18 };
      opportunity.AssertAgeEligibility(null);
      opportunity.SyncedInfo = new SyncInfoEntity { SyncType = SyncType.Pull };
      Assert.Throws<ValidationException>(() => opportunity.AssertAgeEligibility(DateTimeOffset.UtcNow.AddYears(-12)));
    }

    [Fact]
    public void ReversedAgeRangeIsRejected()
    {
      Assert.False(ValidateCore(CreateValidator(), new OpportunityRequestCreate { AgeFrom = 25, AgeTo = 18 }).IsValid);
    }

    private static readonly string[] CoreProperties = ["", "Provider", "Incentivized", "RewardType", "PartnerIncentiveAmount", "PartnerIncentiveCurrency", "AccessibilitySupport", "AccommodationOtherDescription", "AgeFrom", "AgeTo", "Accommodations", "TargetedGroups", "SustainableDevelopmentGoals"];

    private static ValidationResult ValidateCore(OpportunityRequestValidatorCreate validator, OpportunityRequestCreate request)
    {
      // These tests isolate the new rules; existing required-field coverage lives in the other fixtures.
      return new ValidationResult(validator.Validate(request).Errors.Where(o => CoreProperties.Contains(o.PropertyName)));
    }

    private static OpportunityRequestValidatorCreate CreateValidator()
    {
      var types = new Mock<IOpportunityTypeService>();
      types.Setup(o => o.GetByIdOrNull(JobId)).Returns(new Domain.Opportunity.Models.Lookups.OpportunityType
      {
        Id = JobId,
        Name = Domain.Opportunity.Type.Job.ToString()
      });
      var currencies = new Mock<ICurrencyService>();
      currencies.Setup(o => o.List()).Returns([new Currency { Code = "USD", Name = "US Dollar" }]);
      var accommodations = new Mock<IAccessibilityService>();
      accommodations.Setup(o => o.List()).Returns([
        new Accessibility { Id = AccommodationId, Name = "Quiet workspace" },
        new Accessibility { Id = OtherId, Name = "Other" }]);
      var groups = new Mock<ITargetedGroupService>();
      groups.Setup(o => o.List()).Returns([
        new TargetedGroup { Id = OpenToAllId, Name = "Open to all" }]);
      var goals = new Mock<ISustainableDevelopmentGoalService>();
      goals.Setup(o => o.List()).Returns([]);

      var countries = new Mock<ICountryService>();
      return new OpportunityRequestValidatorCreate(types.Object, Mock.Of<IOrganizationService>(),
        Mock.Of<IEngagementTypeService>(), Mock.Of<ITimeIntervalService>(),
        Mock.Of<IOpportunityCategoryService>(), countries.Object, Mock.Of<ILanguageService>(), Mock.Of<ISkillService>(),
        Mock.Of<IOpportunityVerificationTypeService>(), new OpportunityRequestCountryValidator(countries.Object, new Domain.Core.Validators.CoordinatesValidator()),
        currencies.Object, accommodations.Object, groups.Object, goals.Object);
    }
  }
}
