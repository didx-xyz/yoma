using CsvHelper;
using System.Globalization;
using System.Text;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Test.Core
{
  public class CsvExportTests
  {
    #region Public Members
    [Theory]
    [InlineData("en-US", ',')]
    [InlineData("en-ZA", ',')]
    [InlineData("fr-FR", ';')]
    public void OpportunityExportsPreserveComputedColumnsFormatsEscapingAndBom(string cultureName, char separator)
    {
      var previousCulture = CultureInfo.CurrentCulture;
      try
      {
        var culture = CultureInfo.GetCultureInfo(cultureName);
        CultureInfo.CurrentCulture = culture;
        var date = new DateTimeOffset(2026, 10, 28, 12, 34, 56, TimeSpan.FromHours(2));
        var opportunity = new OpportunityInfo
        {
          Title = "Quoted, \"title\" – café",
          Description = "First\r\nSecond",
          OrganizationName = "Org",
          Summary = " space ",
          Incentivized = true,
          ZltoReward = 12.50m,
          Hidden = false,
          DateStart = date,
          Keywords = ["one", "two"],
          Categories = [new() { Name = "Category" }],
          Skills = [new() { Name = "Skill" }],
          CustomFields = [new() { Key = "Business", DataType = CustomFieldDataType.String, ValueRaw = "Test" }]
        };

        var (fileName, bytes) = FileHelper.CreateCsvFile([opportunity], "sample", false);
        Assert.Equal("sample.csv", fileName);
        Assert.True(bytes.AsSpan().StartsWith(Encoding.UTF8.GetPreamble()));
        var text = Encoding.UTF8.GetString(bytes.AsSpan(3));
        Assert.Contains("\" space \"", text);
        Assert.EndsWith("\r\n", text);

        using var reader = CsvReader.Create(new StringReader(text), new CsvReaderOptions { Separator = separator });
        Assert.True(reader.Read());
        Assert.Equal("Title", reader.Headers[0]);
        Assert.Equal("Custom Fields", reader.Headers[^1]);
        Assert.DoesNotContain("Id", reader.Headers);
        Assert.DoesNotContain("SyncedInfo", reader.Headers);
        Assert.Equal(opportunity.Title, reader.GetString("Title"));
        Assert.Equal(opportunity.Description, reader.GetString("Description"));
        Assert.Equal("Org", reader.GetString("Organization Name"));
        Assert.Equal("Yes", reader.GetString("Incentivized"));
        Assert.Equal("No", reader.GetString("Hidden"));
        Assert.Equal(12.50m.ToString(culture), reader.GetString("Zlto Reward"));
        Assert.Equal(date.ToString(culture), reader.GetString("Start Date"));
        Assert.Equal("one, two", reader.GetString("Keywords"));
        Assert.Equal("Category", reader.GetString("Categories"));
        Assert.Equal("Skill", reader.GetString("Skills"));
        Assert.Equal("Business: Test", reader.GetString("Custom Fields"));
        Assert.Equal("No", reader.GetString("Externally Managed (Locked)"));
        Assert.False(reader.Read());
      }
      finally
      {
        CultureInfo.CurrentCulture = previousCulture;
      }
    }

    [Fact]
    public void CompletionExportsKeepLocationSkillsAndCustomFieldsWithoutLeakingIgnoredFields()
    {
      var completion = new MyOpportunityInfo
      {
        UserEmail = "test@example.org",
        UserDisplayName = "User",
        OpportunityTitle = "Opportunity",
        Country = "South Africa",
        Skills = [new() { Name = "Skill" }],
        CustomFields = [new() { Key = "EventRole", DataType = CustomFieldDataType.Option, ValueRaw = "Attendee" }]
      };
      var (_, bytes) = FileHelper.CreateCsvFile([completion], "completions", false);
      using var reader = CsvReader.Create(new MemoryStream(bytes), new CsvReaderOptions
      {
        Separator = CultureInfo.CurrentCulture.TextInfo.ListSeparator[0]
      });
      Assert.True(reader.Read());
      Assert.Equal("test@example.org", reader.GetString("Student Email"));
      Assert.Equal("South Africa", reader.GetString("Country Completed"));
      Assert.Equal("Skill", reader.GetString("Skills"));
      Assert.Equal("EventRole: Attendee", reader.GetString("Custom Fields"));
      Assert.DoesNotContain("UserSettings", reader.Headers);
      Assert.DoesNotContain("CountryId", reader.Headers);
      Assert.DoesNotContain("Region", reader.Headers);
      Assert.DoesNotContain("Verifications", reader.Headers);
    }

    [Fact]
    public void EmptyExportsStillContainTheFullHeader()
    {
      var (_, bytes) = FileHelper.CreateCsvFile(Array.Empty<OpportunityInfo>(), "empty", false);
      using var reader = CsvReader.Create(new MemoryStream(bytes), new CsvReaderOptions
      {
        Separator = CultureInfo.CurrentCulture.TextInfo.ListSeparator[0]
      });
      reader.ReadHeader();
      Assert.Equal("Title", reader.Headers[0]);
      Assert.Contains("Categories", reader.Headers);
      Assert.Contains("Custom Fields", reader.Headers);
      Assert.False(reader.Read());
    }
    #endregion
  }
}
