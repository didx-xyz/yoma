using FluentValidation;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Moq;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.Core
{
  public class OpportunityJobCustomFieldTests
  {
    #region Tests
    [Fact]
    public void SeedsJobMetadataAndOfficialClassificationsWithoutDuplicatingCoreFields()
    {
      var definitions = Definitions();
      Assert.Equal(13, definitions.Count);
      Assert.All(definitions, o =>
      {
        Assert.Equal("Job", o.EntityContext);
        Assert.Equal("Job details", o.Group);
        Assert.True(o.IsActive);
      });

      Assert.Equal(22, definitions.Single(o => o.Key == CustomFieldConstants.Job.Industry).Options!.Count);
      var categories = definitions.Single(o => o.Key == "jobCategory").Options!;
      Assert.Equal(43, categories.Count);
      Assert.Contains(categories, o => o.Key == "01");
      Assert.All(categories, o => Assert.Equal(2, o.Key.Length));
      Assert.Equal(CustomFieldLookupType.Education, definitions.Single(o => o.Key == "jobMinimumQualification").LookupType);
      Assert.Equal(CustomFieldLookupType.Skill, definitions.Single(o => o.Key == "jobPreferredSkills").LookupType);
      Assert.Equal(CustomFieldLookupType.Currency, definitions.Single(o => o.Key == CustomFieldConstants.Job.Salary.Currency).LookupType);
      Assert.DoesNotContain(definitions, o => o.Key.Contains("Deadline") || o.Key.Contains("Language") || o.Key == "jobExperienceLevel");
    }

    [Theory]
    [InlineData("jobEmploymentType", typeof(EmploymentType))]
    public void CodeInterpretedOptionsAgreeWithProtectedMetadata(string key, System.Type type)
    {
      var definition = Definitions().Single(o => o.Key == key);
      Assert.True(definition.IsSystem);
      Assert.All(Enum.GetNames(type), key => Assert.Contains(definition.Options!, option => option.Key == key));
    }

    [Theory]
    [InlineData(CustomFieldConstants.Job.Employment.Schedule, CustomFieldConstants.Job.Employment.ScheduleOptions.FullTime)]
    [InlineData(CustomFieldConstants.Job.Employment.Schedule, CustomFieldConstants.Job.Employment.ScheduleOptions.PartTime)]
    [InlineData(CustomFieldConstants.Job.Salary.PayInterval, CustomFieldConstants.Job.Salary.PayIntervalOptions.PerYear)]
    [InlineData(CustomFieldConstants.Job.Salary.PayInterval, CustomFieldConstants.Job.Salary.PayIntervalOptions.PerMonth)]
    [InlineData(CustomFieldConstants.Job.Salary.PayInterval, CustomFieldConstants.Job.Salary.PayIntervalOptions.PerHour)]
    [InlineData(CustomFieldConstants.Job.Salary.PayInterval, CustomFieldConstants.Job.Salary.PayIntervalOptions.PerEngagement)]
    public void PartnerMappingConstantsAgreeWithProtectedMetadata(string key, string option)
    {
      var definition = Definitions().Single(o => o.Key == key);
      Assert.True(definition.IsSystem);
      Assert.Contains(definition.Options!, o => o.Key == option);
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
        { "jobMinimumQualification", "Tertiary - Diploma" },
        { CustomFieldConstants.Job.Salary.Currency, "ZAR" }
      });
      Assert.Equal(educationId.ToString(), Assert.Single(fields!.Single(o => o.Key == "jobMinimumQualification").Values!));
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

    [Theory]
    [InlineData("jobSalaryMinimum", CustomFieldDataType.Decimal)]
    [InlineData("jobSalaryMaximum", CustomFieldDataType.Decimal)]
    [InlineData("jobEmploymentDuration", CustomFieldDataType.Integer)]
    public void NonPositiveValuesAreRejected(string key, CustomFieldDataType type)
    {
      Assert.Throws<ValidationException>(() => Validate([Scalar(key, "0", type)], false));
      Assert.Throws<ValidationException>(() => Validate([Scalar(key, "-1", type)], false));
    }
    #endregion

    #region Private Members
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

    private static List<CustomFieldDefinition> Definitions()
    {
      var seeds = new ApplicationDb_CF_Configuration().UpOperations.OfType<InsertDataOperation>().ToList();
      var definitions = Assert.Single(seeds, o => o.Table == "CustomFieldDefinition" && o.Columns.Contains("LookupType"));
      var options = Assert.Single(seeds, o => o.Table == "CustomFieldOption" &&
        o.Values[0, 0] is Guid id && id == new Guid("cf0b0001-0929-4cf0-a100-000000000101"));
      var result = new List<CustomFieldDefinition>();
      for (var row = 0; row < definitions.Values.GetLength(0); row++)
      {
        object? Value(string name) => definitions.Values[row, Array.IndexOf(definitions.Columns, name)];
        result.Add(new CustomFieldDefinition
        {
          Id = (Guid)Value("Id")!,
          EntityType = (string)Value("EntityType")!,
          EntityContext = (string)Value("EntityContext")!,
          Key = (string)Value("Key")!,
          Title = (string)Value("Title")!,
          Group = (string)Value("Group")!,
          SubGroup = (string)Value("SubGroup")!,
          DataType = Enum.Parse<CustomFieldDataType>((string)Value("DataType")!),
          LookupType = Value("LookupType") is string lookup ? Enum.Parse<CustomFieldLookupType>(lookup) : null,
          IsRequired = (bool)Value("IsRequired")!,
          SupportsMultiple = (bool?)Value("SupportsMultiple"),
          IsActive = (bool)Value("IsActive")!,
          IsSystem = (bool)Value("IsSystem")!,
          Options = []
        });
      }

      for (var row = 0; row < options.Values.GetLength(0); row++)
      {
        object Value(string name) => options.Values[row, Array.IndexOf(options.Columns, name)]!;
        result.Single(o => o.Id == (Guid)Value("CustomFieldDefinitionId")).Options!.Add(new CustomFieldOption
        {
          Key = (string)Value("Key"),
          Name = (string)Value("Name"),
          IsActive = (bool)Value("IsActive")
        });
      }

      return result;
    }
    #endregion
  }
}
