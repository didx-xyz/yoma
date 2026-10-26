using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Test.Core.Fixtures;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Services;

namespace Yoma.Core.Test.Core
{
  public class OpportunityJobCustomFieldTests
  {
    #region Class Variables
    private static readonly string[] JobGroups = ["Compensation", "Employment", "Requirements", "Classification"];
    #endregion Class Variables

    #region Tests

    [Theory]
    [InlineData(100, 0, true)]
    [InlineData(0, 200, true)]
    [InlineData(0, 0, null)]
    [InlineData(null, null, null)]
    public void JobJackIncentiveUsesStructuredSalaryWithoutInventingCurrencyOrUnpaidWork(int? minimum, int? maximum, bool? expected)
    {
      var types = new Mock<IOpportunityTypeService>();
      types.Setup(service => service.GetByName(Domain.Opportunity.Type.Job.ToString()))
        .Returns(new Domain.Opportunity.Models.Lookups.OpportunityType { Id = Guid.NewGuid() });
      var categories = new Mock<IOpportunityCategoryService>();
      categories.Setup(service => service.GetByName(Category.Other.ToString()))
        .Returns(new Domain.Opportunity.Models.Lookups.OpportunityCategory { Id = Guid.NewGuid() });
      var countries = new Mock<ICountryService>();
      countries.Setup(service => service.GetByCodeAlpha2(Country.SouthAfrica.ToDescription()))
        .Returns(new Domain.Lookups.Models.Country { Id = Guid.NewGuid() });
      var languages = new Mock<ILanguageService>();
      languages.Setup(service => service.GetByName(Language.English.ToString()))
        .Returns(new Domain.Lookups.Models.Language { Id = Guid.NewGuid() });

      var client = new Infrastructure.JobJack.Client.JobJackClient(
        Mock.Of<ILogger<Infrastructure.JobJack.Client.JobJackClient>>(),
        Options.Create(new Infrastructure.JobJack.Models.JobJackOptions { OrganizationIdYoma = Guid.NewGuid() }),
        types.Object, categories.Object, countries.Object, languages.Object,
        Mock.Of<ICustomFieldDefinitionService>(),
        Mock.Of<IRepositoryBatched<Infrastructure.JobJack.Models.Opportunity>>(),
        new Domain.PartnerSync.Validators.SyncFilterPullEntityValidator());
      var source = new Infrastructure.JobJack.Models.Opportunity
      {
        ExternalId = "isolated-job",
        Title = "Partner role",
        SalaryLow = minimum,
        SalaryHigh = maximum,
        SalaryType = "Market Related",
        DateCreated = DateTimeOffset.UtcNow
      };
      var mapper = typeof(Infrastructure.JobJack.Client.JobJackClient)
        .GetMethod("ToOpportunity", BindingFlags.Instance | BindingFlags.NonPublic)!;
      var result = (Domain.PartnerSync.Models.SyncItemEntity<Domain.Opportunity.Models.OpportunityRequestCreate>)
        mapper.Invoke(client, [source])!;

      Assert.Equal(expected, result.Item.Incentivized);
      Assert.DoesNotContain(result.Item.CustomFields!, field => field.Key == CustomFieldConstants.Job.Salary.Currency);
      Assert.Equal(expected == true, result.Item.CustomFields!.Any(field =>
        field.Key == CustomFieldConstants.Job.Salary.Disclosed && field.Value == bool.TrueString));
      Assert.Null(result.Item.ZltoReward);
      Assert.False(result.Item.VerificationEnabled);
    }

    [Fact]
    public void JobJackSnapshotMapsAndOwnsEverySupportedCustomField()
    {
      var fields = MapJobJackCustomFields(new()
      {
        SalaryLow = 100,
        SalaryHigh = 200,
        SalaryFrequency = "per hour",
        ContractType = "Full time contract",
        Category = "Retail"
      });

      Assert.Equal(6, fields.Count);
      Assert.Equal(bool.TrueString, fields.Single(field => field.Key == CustomFieldConstants.Job.Salary.Disclosed).Value);
      Assert.Equal("100", fields.Single(field => field.Key == CustomFieldConstants.Job.Salary.Minimum).Value);
      Assert.Equal("200", fields.Single(field => field.Key == CustomFieldConstants.Job.Salary.Maximum).Value);
      Assert.Equal([CustomFieldConstants.Job.Salary.PayIntervalOptions.PerHour],
        fields.Single(field => field.Key == CustomFieldConstants.Job.Salary.PayInterval).Values!);
      Assert.Equal([CustomFieldConstants.Job.Employment.ScheduleOptions.FullTime],
        fields.Single(field => field.Key == CustomFieldConstants.Job.Employment.Schedule).Values!);
      Assert.Equal([CustomFieldConstants.Job.IndustryOptions.Retail],
        fields.Single(field => field.Key == CustomFieldConstants.Job.Industry).Values!);

      var ownedKeys = Assert.IsType<string[]>(typeof(Infrastructure.JobJack.Client.JobJackClient)
        .GetField("CustomField_Snapshot_Keys", BindingFlags.Static | BindingFlags.NonPublic)!.GetValue(null));
      Assert.Equal(ownedKeys.Order(), fields.Select(field => field.Key).Order());
    }

    [Theory]
    [InlineData(null, null, null)]
    [InlineData("Unknown schedule", "Unknown interval", "Unknown industry")]
    public void JobJackSnapshotClearsUnavailableOwnedValuesWithoutTouchingUnmappedFields(
      string? schedule, string? interval, string? industry)
    {
      var fields = MapJobJackCustomFields(new()
      {
        SalaryLow = 0,
        SalaryHigh = 0,
        SalaryFrequency = interval,
        ContractType = schedule,
        Category = industry
      });

      Assert.Equal(6, fields.Count);
      Assert.All(fields, field =>
      {
        Assert.Null(field.Value);
        Assert.Null(field.Values);
      });
      Assert.DoesNotContain(fields, field => field.Key == CustomFieldConstants.Job.Salary.Currency);
      Assert.DoesNotContain(fields, field => field.Key == CustomFieldConstants.Job.Employment.Type);
      Assert.DoesNotContain(fields, field => field.Key == CustomFieldConstants.Job.MinimumQualification);
    }

    [Fact]
    public void JobJackSnapshotClearsWithdrawnUpperAmountAndIntervalWhileKeepingAvailableValues()
    {
      var fields = MapJobJackCustomFields(new()
      {
        SalaryLow = 100,
        ContractType = "Part time contract",
        Category = "Retail"
      });

      Assert.Equal("100", fields.Single(field => field.Key == CustomFieldConstants.Job.Salary.Minimum).Value);
      Assert.Null(fields.Single(field => field.Key == CustomFieldConstants.Job.Salary.Maximum).Value);
      Assert.Null(fields.Single(field => field.Key == CustomFieldConstants.Job.Salary.PayInterval).Values);
      Assert.Equal([CustomFieldConstants.Job.Employment.ScheduleOptions.PartTime],
        fields.Single(field => field.Key == CustomFieldConstants.Job.Employment.Schedule).Values!);
    }

    [Fact]
    public void MissingImportedFieldsAreAllowedButManualRequiredFieldsAreNot()
    {
      var service = CreateValueService();
      service.Validate(CustomFieldEntityType.Opportunity, "Job", null, CustomFieldUpsertMode.PatchAllowMissingRequired);
      Assert.Throws<ValidationException>(() => service.Validate(CustomFieldEntityType.Opportunity, "Job", null,
        CustomFieldUpsertMode.PutEnforceRequired));
    }

    [Fact]
    public void EducationAndCurrencyUseSharedLookupIdsAndCsvNamesOrCodes()
    {
      var educationId = Guid.NewGuid();
      var currencyId = Guid.NewGuid();
      var education = new Mock<IEducationService>();
      education.Setup(o => o.GetByNameOrNull("Tertiary - Diploma"))
        .Returns(new Domain.Lookups.Models.Education { Id = educationId, Name = "Tertiary - Diploma" });
      education.Setup(o => o.GetByIdOrNull(educationId))
        .Returns(new Domain.Lookups.Models.Education { Id = educationId, Name = "Tertiary - Diploma" });
      var currency = new Mock<ICurrencyService>();
      currency.Setup(o => o.GetByCodeOrNull("ZAR"))
        .Returns(new Domain.Lookups.Models.Currency { Id = currencyId, Code = "ZAR", Name = "Rand" });
      currency.Setup(o => o.GetByIdOrNull(currencyId))
        .Returns(new Domain.Lookups.Models.Currency { Id = currencyId, Code = "ZAR", Name = "Rand" });
      var service = CreateValueService(education.Object, currency.Object);

      var fields = service.ParseCSVValues(CustomFieldEntityType.Opportunity, "Job", new Dictionary<string, string?>
      {
        { "JobMinimumQualification", "Tertiary - Diploma" },
        { CustomFieldConstants.Job.Salary.Currency, "ZAR" }
      });
      Assert.Equal(educationId.ToString(), Assert.Single(fields!.Single(o => o.Key == "JobMinimumQualification").Values!));
      Assert.Equal(currencyId.ToString(), Assert.Single(fields!.Single(o => o.Key == CustomFieldConstants.Job.Salary.Currency).Values!));
      service.Validate(CustomFieldEntityType.Opportunity, "Job", fields, CustomFieldUpsertMode.PatchAllowMissingRequired);
      Assert.Throws<ValidationException>(() => service.Validate(CustomFieldEntityType.Opportunity, "Job",
        [new CustomFieldValueRequest { Key = CustomFieldConstants.Job.Salary.Currency, Values = ["ZAR"] }],
        CustomFieldUpsertMode.PatchAllowMissingRequired));
    }

    [Fact]
    public void ValidSalaryAndPermanentEmploymentPassManualRules()
    {
      Validate([
        Scalar(CustomFieldConstants.Job.Salary.Disclosed, "true", CustomFieldDataType.Boolean),
        Scalar(CustomFieldConstants.Job.Salary.Minimum, "100", CustomFieldDataType.Decimal),
        Option(CustomFieldConstants.Job.Salary.Currency, Guid.NewGuid().ToString()),
        Option(CustomFieldConstants.Job.Salary.PayInterval, CustomFieldConstants.Job.Salary.PayIntervalOptions.PerMonth),
        Option(CustomFieldConstants.Job.Employment.Type, EmploymentType.Permanent.ToString())
      ], true);
    }

    [Fact]
    public void PartialImportCanLackCurrencyButCannotContradictDisclosureOrBounds()
    {
      var fields = new List<CustomFieldValueItem>
      {
        Scalar(CustomFieldConstants.Job.Salary.Disclosed, "true", CustomFieldDataType.Boolean),
        Scalar(CustomFieldConstants.Job.Salary.Minimum, "100", CustomFieldDataType.Decimal)
      };
      Validate(fields, false);
      Assert.Throws<ValidationException>(() => Validate(fields, true));
      fields.Add(Scalar(CustomFieldConstants.Job.Salary.Maximum, "50", CustomFieldDataType.Decimal));
      Assert.Throws<ValidationException>(() => Validate(fields, false));
      fields.RemoveAt(2);
      fields[0] = Scalar(CustomFieldConstants.Job.Salary.Disclosed, "false", CustomFieldDataType.Boolean);
      Assert.Throws<ValidationException>(() => Validate(fields, false));
    }

    [Fact]
    public void SalaryCannotBeAttachedToAnUnincentivizedJob()
    {
      Assert.Throws<ValidationException>(() => Validate(
        [Scalar(CustomFieldConstants.Job.Salary.Minimum, "100", CustomFieldDataType.Decimal)], false, false));
    }

    [Fact]
    public void EmploymentDurationAndPermanentRulesApplyToMergedState()
    {
      var fields = new List<CustomFieldValueItem>
      {
        Option(CustomFieldConstants.Job.Employment.Type, "Internship")
      };
      Validate(fields, false);
      Assert.Throws<ValidationException>(() => Validate(fields, true));
      fields.Add(Scalar(CustomFieldConstants.Job.Employment.Duration, "6", CustomFieldDataType.Integer));
      fields.Add(Option(CustomFieldConstants.Job.Employment.DurationUnit, "Months"));
      Validate(fields, true);
      fields[0] = Option(CustomFieldConstants.Job.Employment.Type, EmploymentType.Permanent.ToString());
      Assert.Throws<ValidationException>(() => Validate(fields, false));
      Assert.Throws<ValidationException>(() => Validate(
        [Option(CustomFieldConstants.Job.Employment.Type, "Permanent|FixedTerm")], false));
    }

    [Fact]
    public void ContractAloneAllowsUnknownTermButDoesNotWaiveOtherEmploymentRules()
    {
      Validate([Option(CustomFieldConstants.Job.Employment.Type, EmploymentType.Contract.ToString())], true);
      var duration = Scalar(CustomFieldConstants.Job.Employment.Duration, "6", CustomFieldDataType.Integer);
      var unit = Option(CustomFieldConstants.Job.Employment.DurationUnit, "Months");
      var contract = Option(CustomFieldConstants.Job.Employment.Type, EmploymentType.Contract.ToString());
      Validate([contract, duration, unit], true);
      Assert.Throws<ValidationException>(() => Validate([contract, duration], true));
      Assert.Throws<ValidationException>(() => Validate([contract, unit], true));
      Validate([contract, duration], false); // Partial external term remains supported.

      foreach (var type in new[] { EmploymentType.FixedTerm.ToString(), "Internship", "TemporarySeasonal" })
      {
        var types = Option(CustomFieldConstants.Job.Employment.Type, $"{EmploymentType.Contract}|{type}");
        Assert.Throws<ValidationException>(() => Validate([types], true));
        Validate([types, duration, unit], true);
      }

      var permanent = Option(CustomFieldConstants.Job.Employment.Type, $"{EmploymentType.Contract}|{EmploymentType.Permanent}");
      Validate([permanent], true);
      Assert.Throws<ValidationException>(() => Validate([permanent, duration, unit], false));
    }

    [Theory]
    [InlineData("JobSalaryMinimum", CustomFieldDataType.Decimal)]
    [InlineData("JobSalaryMaximum", CustomFieldDataType.Decimal)]
    [InlineData("JobEmploymentDuration", CustomFieldDataType.Integer)]
    public void NonPositiveValuesAreRejected(string key, CustomFieldDataType type)
    {
      Assert.Throws<ValidationException>(() => Validate([Scalar(key, "0", type)], false));
      Assert.Throws<ValidationException>(() => Validate([Scalar(key, "-1", type)], false));
    }
    #endregion

    #region Private Members
    private static List<CustomFieldDefinition> Definitions() =>
      [.. CustomFieldFixtureData.CreateDefinitions().Where(definition => definition.EntityType == nameof(CustomFieldEntityType.Opportunity) && definition.EntityContext == nameof(Domain.Opportunity.Type.Job))];

    private static List<CustomFieldValueRequest> MapJobJackCustomFields(Infrastructure.JobJack.Models.Opportunity source)
    {
      var metadata = new Mock<ICustomFieldDefinitionService>();
      metadata.Setup(service => service.GetByKey(CustomFieldEntityType.Opportunity, It.IsAny<string>(), true, true))
        .Returns((CustomFieldEntityType _, string key, bool _, bool _) => Definitions().Single(definition => definition.Key == key));
      var client = new Infrastructure.JobJack.Client.JobJackClient(
        Mock.Of<ILogger<Infrastructure.JobJack.Client.JobJackClient>>(),
        Options.Create(new Infrastructure.JobJack.Models.JobJackOptions()),
        Mock.Of<IOpportunityTypeService>(), Mock.Of<IOpportunityCategoryService>(),
        Mock.Of<ICountryService>(), Mock.Of<ILanguageService>(), metadata.Object,
        Mock.Of<IRepositoryBatched<Infrastructure.JobJack.Models.Opportunity>>(),
        new Domain.PartnerSync.Validators.SyncFilterPullEntityValidator());
      var fields = Assert.IsType<List<CustomFieldValueRequest>>(typeof(Infrastructure.JobJack.Client.JobJackClient)
        .GetMethod("MapCustomFields", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(client, [source]));
      fields.NormalizeForPatch();
      CreateValueService().Validate(CustomFieldEntityType.Opportunity, "Job", fields, CustomFieldUpsertMode.PatchAllowMissingRequired);
      return fields;
    }

    private static void Validate(List<CustomFieldValueItem> fields, bool required, bool? incentivized = true)
    {
      var method = typeof(OpportunityService).GetMethod("AssertCrossFieldRules", BindingFlags.NonPublic | BindingFlags.Static)!;
      try
      {
        method.Invoke(null, [new Domain.Opportunity.Models.Opportunity
        {
          Type = Domain.Opportunity.Type.Job,
          Incentivized = incentivized,
          CustomFields = fields
        }, required]);
      }
      catch (TargetInvocationException exception) when (exception.InnerException != null)
      {
        System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(exception.InnerException).Throw();
      }
    }

    private static CustomFieldValueItem Scalar(string key, string value, CustomFieldDataType type)
    {
      return new CustomFieldValueItem { Key = key, DataType = type, ValueRaw = value };
    }

    private static CustomFieldValueItem Option(string key, string value)
    {
      return Scalar(key, value, CustomFieldDataType.Option);
    }

    private static CustomFieldValueService CreateValueService(IEducationService? education = null, ICurrencyService? currency = null)
    {
      var definitions = new Mock<ICustomFieldDefinitionService>();
      definitions.Setup(o => o.List(CustomFieldEntityType.Opportunity, true, true, "Job")).Returns(Definitions());
      return new CustomFieldValueService(definitions.Object, Mock.Of<ICountryService>(), Mock.Of<ILanguageService>(),
        Mock.Of<ISkillService>(), education ?? Mock.Of<IEducationService>(), currency ?? Mock.Of<ICurrencyService>(),
        Mock.Of<IRepository<CustomFieldValue>>(), Mock.Of<IExecutionStrategyService>());
    }

    #endregion
  }
}
