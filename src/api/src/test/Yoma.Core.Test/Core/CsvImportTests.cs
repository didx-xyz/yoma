using CsvHelper;
using System.Globalization;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Converters;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Test.Core
{
  public class CsvImportTests
  {
    #region Class Variables
    private const string CompletionHeader = "Email,PhoneNumber,FirstName,Surname,Gender,Country,DateCompleted,CountryCompleted,OpportunityExternalId";
    private const string OpportunityHeader = "Title,Type,Engagement,Categories,Link,Summary,Description,Languages,Location,EffortCount,EffortInterval,DateStart,DateEnd,ParticipantLimit,Provider,ProviderURL,ProviderLogoURL,ProviderCountry,Incentivized,RewardType,PartnerIncentiveAmount,PartnerIncentiveCurrency,AccessibilitySupport,AccommodationOtherDescription,AgeFrom,AgeTo,Accommodations,TargetedGroups,SustainableDevelopmentGoals,ZltoReward,ZltoRewardPool,Skills,Keywords,Hidden,ExternalId";
    #endregion

    #region Public Members
    [Fact]
    public async Task CompletionImportKeepsFirstRecordUnicodeAliasesAndCustomFieldValues()
    {
      var errors = new List<CSVImportErrorRow>();
      using var csv = CompletionReader(CompletionHeader + ",CF:EventRole\r\n"
        + " first@example.org ,,José,,,,2026-10-28,ZA,external-one, Attendee \r\n"
        + "second@example.org,,,,,,,,external-two,\r\n", errors);

      var customHeaders = CSVImportHelper.ValidateHeader<MyOpportunityInfoCsvImport>(csv, errors, true);
      Assert.Equal(["CF:EventRole"], customHeaders);
      Assert.Empty(errors);

      Assert.True(await csv.ReadAsync(TestContext.Current.CancellationToken));
      var first = CSVImportHelper.ReadRecord<MyOpportunityInfoCsvImport>(csv, errors, 2);
      Assert.Equal("first@example.org", first.Email);
      Assert.Equal("José", first.FirstName);
      Assert.Null(first.PhoneNumber);
      Assert.Equal(new DateOnly(2026, 10, 28), first.DateCompleted);
      Assert.Equal("ZA", first.CountryCompleted);
      Assert.Equal("external-one", first.OpportunityExternalId);

      var columns = new Dictionary<string, string> { ["CF:EventRole"] = "EventRole" };
      Assert.Equal("Attendee", CSVImportHelper.ReadCustomFieldValues(csv, columns)!["EventRole"]);
      Assert.True(await csv.ReadAsync(TestContext.Current.CancellationToken));
      Assert.Equal("external-two", csv.GetRecord<MyOpportunityInfoCsvImport>().OpportunityExternalId);
      Assert.Null(CSVImportHelper.ReadCustomFieldValues(csv, columns)!["EventRole"]);
      Assert.False(await csv.ReadAsync(TestContext.Current.CancellationToken));
      Assert.Empty(errors);
    }

    [Theory]
    [InlineData("", CSVImportErrorType.HeaderMissing)]
    [InlineData("something\r\nvalue", CSVImportErrorType.HeaderMissing)]
    [InlineData(CompletionHeader + ",Email", CSVImportErrorType.HeaderDuplicateColumn)]
    [InlineData(CompletionHeader + ",Unknown", CSVImportErrorType.HeaderUnexpectedColumn)]
    [InlineData("Email,PhoneNumber", CSVImportErrorType.HeaderColumnMissing)]
    public void InvalidHeadersAreRejectedBeforeAnyDomainProcessing(string input, CSVImportErrorType expected)
    {
      var errors = new List<CSVImportErrorRow>();
      using var csv = CompletionReader(input, errors);
      CSVImportHelper.ValidateHeader<MyOpportunityInfoCsvImport>(csv, errors, true);
      Assert.True(CSVImportHelper.ContainsHeaderErrors(errors));
      Assert.Contains(errors.SelectMany(row => row.Items), item => item.Type == expected);
    }

    [Theory]
    [InlineData("Yes", true)]
    [InlineData("yes", true)]
    [InlineData("TRUE", true)]
    [InlineData("1", true)]
    [InlineData("01", true)]
    [InlineData("+1", true)]
    [InlineData("No", false)]
    [InlineData("false", false)]
    [InlineData("0", false)]
    [InlineData("-0", false)]
    public void BooleanImportsKeepTheExistingAcceptedValues(string value, bool expected)
    {
      using var csv = CsvReader.Create(new StringReader("Value\r\n" + value), CSVImportHelper.CreateConfig([]));
      Assert.True(csv.Read());
      Assert.Equal(expected, new CsvBooleanConverter().Read(csv, 0));
    }

    [Theory]
    [InlineData("y")]
    [InlineData("n")]
    [InlineData("t")]
    [InlineData("f")]
    [InlineData("2")]
    public void BooleanImportsDoNotGainNewShorthandValues(string value)
    {
      using var csv = CsvReader.Create(new StringReader("Value\r\n" + value), CSVImportHelper.CreateConfig([]));
      Assert.True(csv.Read());
      Assert.Throws<FormatException>(() => new CsvBooleanConverter().Read(csv, 0));
    }

    [Fact]
    public void OpportunityImportPreservesTypedValuesPipeListsAndBlankOptionals()
    {
      var errors = new List<CSVImportErrorRow>();
      using var csv = OpportunityReader(new Dictionary<string, string>
      {
        ["Title"] = "Quoted, \"title\"",
        ["Categories"] = " First | Second ",
        ["Location"] = "Worldwide",
        ["EffortCount"] = "2",
        ["DateStart"] = "2026-10-28",
        ["ZltoReward"] = "12.50",
        ["Hidden"] = "Yes"
      }, errors);

      CSVImportHelper.ValidateHeader<OpportunityInfoCsvImport>(csv, errors, true);
      Assert.Empty(errors);
      Assert.True(csv.Read());
      var record = CSVImportHelper.ReadRecord<OpportunityInfoCsvImport>(csv, errors, 2);
      Assert.Equal("Quoted, \"title\"", record.Title);
      Assert.Equal(["First", "Second"], record.Categories);
      Assert.Equal(["Worldwide"], record.Countries);
      Assert.Equal((short)2, record.CommitmentIntervalCount);
      Assert.Equal(new DateOnly(2026, 10, 28), record.DateStart);
      Assert.Equal(12.50m, record.ZltoReward);
      Assert.True(record.Hidden);
      Assert.Null(record.Incentivized);
      Assert.Null(record.DateEnd);
      Assert.Null(record.Accommodations);
      Assert.Null(record.Provider);
    }

    [Theory]
    [InlineData("Hidden", "maybe")]
    [InlineData("EffortCount", "not-a-number")]
    [InlineData("DateStart", "not-a-date")]
    [InlineData("ZltoReward", "not-an-amount")]
    public void ConversionErrorsIdentifyTheRowFieldAndOriginalValue(string field, string value)
    {
      var errors = new List<CSVImportErrorRow>();
      using var csv = OpportunityReader(new Dictionary<string, string> { [field] = value }, errors);
      CSVImportHelper.ValidateHeader<OpportunityInfoCsvImport>(csv, errors, true);
      Assert.True(csv.Read());
      var exception = Assert.Throws<CsvFormatException>(() => CSVImportHelper.ReadRecord<OpportunityInfoCsvImport>(csv, errors, 2));
      CSVImportHelper.HandleExceptions(exception, errors, 2, csv);
      var error = Assert.Single(Assert.Single(errors).Items);
      Assert.Equal(CSVImportErrorType.InvalidFieldValue, error.Type);
      Assert.Equal(field, error.Field);
      Assert.Equal(value, error.Value);
      Assert.Equal(2, errors[0].Number);
    }

    [Fact]
    public void ShortRowsReportMissingRequiredCellsButAllowMissingOptionalCells()
    {
      var errors = new List<CSVImportErrorRow>();
      using var csv = CompletionReader(CompletionHeader + "\r\ntest@example.org\r\n", errors);
      CSVImportHelper.ValidateHeader<MyOpportunityInfoCsvImport>(csv, errors, true);
      Assert.True(csv.Read());
      CSVImportHelper.ReadRecord<MyOpportunityInfoCsvImport>(csv, errors, 2);
      var error = Assert.Single(Assert.Single(errors).Items);
      Assert.Equal(CSVImportErrorType.RequiredFieldMissing, error.Type);
      Assert.Equal("OpportunityExternalId", error.Field);
    }

    [Fact]
    public void MalformedQuotingProducesAFieldErrorAndCannotPassTheProbeGate()
    {
      var errors = new List<CSVImportErrorRow>();
      using var csv = CompletionReader(CompletionHeader + "\r\nbad\"quote,,,,,,,,external\r\n", errors);
      CSVImportHelper.ValidateHeader<MyOpportunityInfoCsvImport>(csv, errors, true);
      Assert.True(csv.Read());
      Assert.True(CSVImportHelper.ContainsFieldErrors(errors, 2));
      Assert.Equal(CSVImportErrorType.InvalidFieldValue, Assert.Single(Assert.Single(errors).Items).Type);
    }

    [Fact]
    public void BlankLinesAndMultilineFieldsKeepSpreadsheetErrorLocations()
    {
      var errors = new List<CSVImportErrorRow>();
      using var csv = CompletionReader(CompletionHeader + "\r\n\r\n"
        + "first@example.org,,\"First\r\nName\",,,,,,external-one\r\n"
        + "second@example.org,,,,,,,,external-two\r\n", errors);
      CSVImportHelper.ValidateHeader<MyOpportunityInfoCsvImport>(csv, errors, true);
      Assert.True(csv.Read());
      Assert.Equal(3, csv.LineNumber);
      Assert.Equal("First\r\nName", csv.GetRecord<MyOpportunityInfoCsvImport>().FirstName);
      Assert.True(csv.Read());
      Assert.Equal(5, csv.LineNumber);
      Assert.Equal("external-two", csv.GetRecord<MyOpportunityInfoCsvImport>().OpportunityExternalId);
      Assert.Empty(errors);
    }
    #endregion

    #region Private Members
    private static CsvReader CompletionReader(string text, List<CSVImportErrorRow> errors)
    {
      return CsvReader.Create(new CSVTrailingCommaTrimmingTextReader(new StringReader(text)),
        CSVImportHelper.CreateConfig(errors));
    }

    private static CsvReader OpportunityReader(Dictionary<string, string> values, List<CSVImportErrorRow> errors)
    {
      using var text = new StringWriter(CultureInfo.InvariantCulture);
      using (var writer = CsvWriter.Create(text, leaveOpen: true))
      {
        foreach (var header in OpportunityHeader.Split(',')) writer.WriteField(header);
        writer.EndRecord();
        foreach (var header in OpportunityHeader.Split(','))
          writer.WriteField(values.GetValueOrDefault(header)
            ?? (header == "Hidden" ? "No" : header == "DateStart" ? "2026-10-28" : header == "ExternalId" ? "external" : string.Empty));
        writer.EndRecord();
      }
      return CsvReader.Create(new CSVTrailingCommaTrimmingTextReader(new StringReader(text.ToString())),
        CSVImportHelper.CreateConfig(errors));
    }
    #endregion
  }
}
