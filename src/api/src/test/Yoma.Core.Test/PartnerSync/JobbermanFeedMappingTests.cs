using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Reflection;
using System.Xml.Linq;
using Xunit;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Infrastructure.Database.Migrations;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Validators;
using Yoma.Core.Infrastructure.Jobberman.Client;
using Yoma.Core.Infrastructure.Jobberman.Context;
using Yoma.Core.Infrastructure.Jobberman.Models;
using Yoma.Core.Infrastructure.Jobberman.Services;
using CachedOpportunity = Yoma.Core.Infrastructure.Jobberman.Models.Opportunity;
using FeedTracking = Yoma.Core.Infrastructure.Jobberman.Models.FeedSyncTracking;

namespace Yoma.Core.Test.PartnerSync
{
  public class JobbermanFeedMappingTests
  {
    #region Class Variables
    private static readonly XNamespace ContentNamespace = "http://purl.org/rss/1.0/modules/content/";
    private static readonly Guid OrganizationId = Guid.Parse("66e98aba-635e-436c-969e-bc53da6d3a5d");
    private static readonly Guid CountryId = Guid.Parse("ac8ff21a-dd3c-4f37-97a2-fc4f715c3ee0");
    private static readonly Guid LanguageId = Guid.Parse("438a14e0-a82d-4696-9329-fbc51abcf3de");
    private static readonly Guid OtherCategoryId = Guid.Parse("b7731940-1285-4ea3-ae75-fe6aa6875164");
    private static readonly Guid TechnologyCategoryId = Guid.Parse("fa564c1c-591a-4a6d-8294-20165da8866b");
    private static readonly Dictionary<string, Guid> CurrencyIds = new(StringComparer.OrdinalIgnoreCase)
    {
      { "NGN", Guid.Parse("be54b531-5db3-4a1d-b050-e822546cb210") },
      { "GHS", Guid.Parse("5054ae40-cf96-4544-8f0a-e822546cb211") },
      { "USD", Guid.Parse("78cd35dc-2d86-4f25-86d6-e822546cb212") }
    };
    #endregion

    #region Tests
    [Fact]
    public async Task EnhancedFeedMapsStructuredMetadataAndKeepsUnrepresentedDetails()
    {
      var doc = CreateFeed();
      var cached = Assert.Single(Parse(doc));
      var request = await Map(cached);

      Assert.Equal("NG:123", cached.ExternalId);
      Assert.Equal("Short role summary.", cached.Summary);
      Assert.Equal("Short role summary.", request.Summary);
      Assert.Contains("**Responsibilities**", request.Description);
      Assert.Contains("- Build services", request.Description);
      Assert.Equal("NGN 250,000 - 400,000", cached.Salary);
      Assert.Equal("Mid level", cached.ExperienceLevel);
      Assert.Equal("3 years", cached.ExperienceLength);
      Assert.Equal("HND", cached.MinimumQualification);
      Assert.Contains("**Experience level:** Mid level", request.Description);
      Assert.Contains("**Experience length:** 3 years", request.Description);
      Assert.Contains("**Minimum qualification:** HND", request.Description);
      Assert.Contains("**Location:** Lagos, Nigeria", request.Description);
      Assert.DoesNotContain("**Contract type:**", request.Description);
      Assert.DoesNotContain("<p>", request.Description);
      Assert.DoesNotContain("**Job function:**", request.Description);
      Assert.Equal(new[] { TechnologyCategoryId }, request.Categories);
      Assert.Equal(new[] { CountryId }, request.Countries!.Select(country => country.CountryId));
      Assert.Equal(new[] { LanguageId }, request.Languages);
      Assert.Equal(OrganizationId, request.OrganizationId);
      Assert.Contains("Full Time", request.Keywords!);
      Assert.Contains("Software & Data", request.Keywords!);
      Assert.False(request.VerificationEnabled);
      Assert.False(request.CredentialIssuanceEnabled);
      Assert.Equal("250000", request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Minimum).Value);
      Assert.Equal("400000", request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Maximum).Value);
      Assert.Equal(CustomFieldConstants.Job.Employment.ScheduleOptions.FullTime,
        Assert.Single(request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Employment.Schedule).Values!));
      Assert.Null(request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Experience.Level).Values);
      Assert.True(request.Incentivized);
      Assert.Null(request.CommitmentIntervalId);
      Assert.Null(request.CommitmentIntervalCount);
      Assert.Null(request.DateEnd);
    }

    [Fact]
    public async Task EnhancedNamesTakePrecedenceOverLegacyAliases()
    {
      var doc = CreateFeed();
      var item = doc.Root!.Element("channel")!.Element("item")!;
      item.Add(new XElement("job_function", "Sales"), new XElement("salary", "Legacy salary"));
      var request = await Map(Assert.Single(Parse(doc)));

      Assert.Equal(new[] { TechnologyCategoryId }, request.Categories);
      Assert.DoesNotContain("Legacy salary", request.Description);
    }

    [Fact]
    public async Task LegacyFeedStillUsesShortDescriptionAndLegacyFieldNames()
    {
      var doc = CreateFeed();
      var item = doc.Root!.Element("channel")!.Element("item")!;
      item.Element(ContentNamespace + "encoded")!.Remove();
      item.Element("category")!.Name = "job_function";
      item.Element("price")!.Name = "salary";
      var request = await Map(Assert.Single(Parse(doc)));

      Assert.StartsWith("Short role summary.", request.Description);
      Assert.Equal("Short role summary.", request.Summary);
      Assert.Equal("250000", request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Minimum).Value);
      Assert.Equal(new[] { TechnologyCategoryId }, request.Categories);
    }

    [Theory]
    [InlineData("<p><br></p>")]
    [InlineData("   ")]
    public async Task EmptyFormattedContentFallsBackToShortDescription(string content)
    {
      var doc = CreateFeed();
      doc.Root!.Element("channel")!.Element("item")!.Element(ContentNamespace + "encoded")!.Value = content;
      var request = await Map(Assert.Single(Parse(doc)));

      Assert.StartsWith("Short role summary.", request.Description);
    }

    [Fact]
    public async Task CdataAndAlternateNamespacePrefixPreserveFormattedContent()
    {
      var doc = XDocument.Parse("""
        <rss xmlns:body="http://purl.org/rss/1.0/modules/content/" version="2.0">
          <channel><item><guid>456</guid><title>Developer</title><description>Short summary</description>
          <body:encoded><![CDATA[<p><strong>Role</strong></p><ul><li>Build &amp; test</li></ul>]]></body:encoded>
          </item></channel>
        </rss>
        """);
      var request = await Map(Assert.Single(Parse(doc)));

      Assert.Contains("**Role**", request.Description);
      Assert.Contains("- Build & test", request.Description);
      Assert.Equal("Short summary", request.Summary);
    }

    [Theory]
    [InlineData("USD 150 - 300")]
    [InlineData("NGN Commission Only")]
    [InlineData("NGN Above 5,000,000")]
    [InlineData("GHS 1,800 - 2,100")]
    public async Task SalaryKeepsSourceCurrencyAndNonNumericMeaning(string salary)
    {
      var doc = CreateFeed();
      doc.Root!.Element("channel")!.Element("item")!.Element("price")!.Value = salary;
      var request = await Map(Assert.Single(Parse(doc)));

      if (salary is "USD 150 - 300" or "GHS 1,800 - 2,100")
        Assert.NotNull(request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Minimum).Value);
      else
        Assert.Contains($"**Salary:** {salary}", request.Description);
      Assert.DoesNotContain("per month", request.Description);
    }

    [Fact]
    public async Task OmittedMetadataDoesNotInventValuesOrLabels()
    {
      var doc = CreateFeed();
      var item = doc.Root!.Element("channel")!.Element("item")!;
      foreach (var field in new[] { "price", "experience_level", "experience_length", "minimum_qualification", "location", "work_type", "category" })
        item.Element(field)!.Remove();
      var cached = Assert.Single(Parse(doc));
      var request = await Map(cached);

      Assert.DoesNotContain("**Salary:**", request.Description);
      Assert.DoesNotContain("**Experience level:**", request.Description);
      Assert.DoesNotContain("**Experience length:**", request.Description);
      Assert.DoesNotContain("**Minimum qualification:**", request.Description);
      Assert.DoesNotContain("**Location:**", request.Description);
      Assert.DoesNotContain("**Contract type:**", request.Description);
      Assert.Equal(new[] { OtherCategoryId }, request.Categories);
      Assert.Equal(new[] { LanguageId }, request.Languages);
      Assert.Null(cached.Language);
      Assert.Null(cached.DateStart);
      Assert.Null(cached.DateEnd);
      Assert.Equal(cached.DateCreated, request.DateStart);
      Assert.Null(request.Keywords);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("<p><br></p>")]
    public async Task MissingSummaryUsesBoundedTitleFallback(string? summary)
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.Title = new string('T', 200);
      cached.Summary = summary;
      var request = await Map(cached);

      Assert.Equal(cached.Title.TrimToLengthWithEllipsis(OpportunityService.Summary_MaxLength), request.Summary);
    }

    [Fact]
    public async Task SummaryIsPlainTextNormalizedAndCappedWithoutTruncatingFullBody()
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.Summary = "<p>  Build &amp; test\n" + new string('A', 200) + "</p>";
      cached.Description = "<p>" + new string('B', 600) + "</p>";
      var request = await Map(cached);

      Assert.StartsWith("Build & test ", request.Summary);
      Assert.Equal(OpportunityService.Summary_MaxLength, request.Summary!.Length);
      Assert.EndsWith("...", request.Summary);
      Assert.DoesNotContain("<", request.Summary);
      Assert.DoesNotContain("\n", request.Summary);
      Assert.Contains(new string('B', 600), request.Description);
    }

    [Theory]
    [InlineData("Unknown function")]
    [InlineData("Unspecified")]
    public async Task UnknownJobFunctionKeepsOtherFallback(string category)
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.Category = category;
      var request = await Map(cached);

      Assert.Equal(new[] { OtherCategoryId }, request.Categories);
    }

    [Fact]
    public async Task DetailedRemoteLocationDoesNotChangeCountryOrCreateWorkingHours()
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.Location = "Remote (Work From Home), Nigeria";
      cached.WorkType = "Part Time";
      var request = await Map(cached);

      Assert.Equal(new[] { CountryId }, request.Countries!.Select(country => country.CountryId));
      Assert.Contains("**Location:** Remote (Work From Home), Nigeria", request.Description);
      Assert.Equal(CustomFieldConstants.Job.Employment.ScheduleOptions.PartTime,
        Assert.Single(request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Employment.Schedule).Values!));
      Assert.Null(request.CommitmentIntervalId);
      Assert.Null(request.CommitmentIntervalCount);
    }

    [Fact]
    public async Task RepeatedMappingHasStableHashAndMetadataChangesTriggerUpdate()
    {
      var first = Assert.Single(Parse(CreateFeed()));
      var second = Assert.Single(Parse(CreateFeed()));
      var id = Guid.NewGuid();
      var hash = HashHelper.ComputeSHA256Hash((await Map(first)).ToRequestUpdate(id, applyHidden: false));

      Assert.Equal(hash, HashHelper.ComputeSHA256Hash((await Map(second)).ToRequestUpdate(id, applyHidden: false)));

      second.Summary = "Updated summary";
      Assert.NotEqual(hash, HashHelper.ComputeSHA256Hash((await Map(second)).ToRequestUpdate(id, applyHidden: false)));

      second.Summary = first.Summary;
      second.Description += "<p><strong>Salary:</strong> USD 900</p>";
      Assert.NotEqual(hash, HashHelper.ComputeSHA256Hash((await Map(second)).ToRequestUpdate(id, applyHidden: false)));
    }

    [Theory]
    [InlineData("GH")]
    [InlineData("NG")]
    public async Task EveryEmbeddedSampleParsesAndMapsEnhancedFields(string country)
    {
      var assembly = typeof(OpportunityFeedBackgroundService).Assembly;
      using var stream = assembly.GetManifestResourceStream($"{assembly.GetName().Name}.Resources.jobs.sample-{country}.xml");
      Assert.NotNull(stream);
      var doc = XDocument.Load(stream);
      var items = Parse(doc, country);
      var sourceItems = doc.Root!.Element("channel")!.Elements("item").ToList();

      var expectedCount = country == "GH" ? 12 : 11;
      Assert.Equal(expectedCount, items.Count);
      Assert.Equal(expectedCount, items.Select(item => item.ExternalId).Distinct().Count());
      Assert.Equal(10, items.Count(item => !item.SourceId.StartsWith("test-mapping-", StringComparison.Ordinal)));
      Assert.Contains(sourceItems, item => item.Element("price") == null);
      Assert.Contains(sourceItems, item => item.Element("price") != null);

      foreach (var cached in items)
      {
        var source = sourceItems.Single(item => item.Element("guid")!.Value == cached.SourceId);
        var request = await Map(cached);
        Assert.Equal(source.Element("category")?.Value, cached.Category);
        Assert.Equal(source.GetElementContent("description"), cached.Summary);
        Assert.InRange(request.Summary!.Length, 1, OpportunityService.Summary_MaxLength);
        var sourceBody = source.GetElementContent(ContentNamespace + "encoded") ?? source.GetElementContent("description");
        Assert.StartsWith(sourceBody.HtmlToMarkdown()!, request.Description);
        // Preserve source content/labels while independently rejecting the empty-bold regression.
        Assert.DoesNotContain(request.Description.Split('\n'), line => line.Trim() is "**" or "*");
        var descriptionWithoutBold = request.Description.RemoveMarkdownAsterisks();
        if (cached.ExperienceLevel != null && request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Experience.Level).Values == null)
          Assert.Contains($"Experience level: {source.Element("experience_level")!.Value}", descriptionWithoutBold);
        if (cached.ExperienceLength != null)
          Assert.Contains($"Experience length: {source.Element("experience_length")!.Value}", descriptionWithoutBold);
        if (cached.MinimumQualification != null && request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.MinimumQualification).Values == null)
          Assert.Contains($"Minimum qualification: {source.Element("minimum_qualification")!.Value}", descriptionWithoutBold);
        if (cached.Location != null)
          Assert.Contains($"**Location:** {source.Element("location")!.Value}", request.Description);
        var salary = source.Element("price")?.Value;
        if (salary != null && request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Minimum).Value == null)
          Assert.Contains($"**Salary:** {salary}", request.Description);
        else if (salary == null)
        {
          // A publisher may already discuss salary in the full body even when price is omitted.
          var originalDescription = sourceBody.HtmlToMarkdown()!;
          Assert.Equal(originalDescription.Split("**Salary:**").Length, request.Description.Split("**Salary:**").Length);
        }

        Assert.Equal(source.Element("price")?.Value, cached.Salary);
        Assert.Equal(source.Element("experience_level")?.Value, cached.ExperienceLevel);
        Assert.Equal(source.Element("experience_length")?.Value, cached.ExperienceLength);
        Assert.Equal(source.Element("minimum_qualification")?.Value, cached.MinimumQualification);
        Assert.False(request.VerificationEnabled);
        Assert.False(request.CredentialIssuanceEnabled);
      }
    }

    [Fact]
    public async Task EmbeddedSamplesCoverExactAndOneSidedSalaryAndMissingMetadata()
    {
      var assembly = typeof(OpportunityFeedBackgroundService).Assembly;
      var rows = new List<(CachedOpportunity Source, OpportunityRequestCreate Mapped)>();
      foreach (var country in new[] { "GH", "NG" })
      {
        using var stream = assembly.GetManifestResourceStream($"{assembly.GetName().Name}.Resources.jobs.sample-{country}.xml")!;
        foreach (var source in Parse(XDocument.Load(stream), country))
          rows.Add((source, await Map(source)));
      }

      var exact = rows.Single(row => row.Source.SourceId == "test-mapping-exact-salary").Mapped;
      Assert.Equal("2500", exact.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Minimum).Value);
      Assert.Equal("2500", exact.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Maximum).Value);
      Assert.Equal([CustomFieldConstants.Job.Experience.Options.EntryJunior],
        exact.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Experience.Level).Values!);
      var upper = rows.Single(row => row.Source.SourceId == "test-mapping-maximum-salary").Mapped;
      Assert.Null(upper.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Minimum).Value);
      Assert.Equal("400000", upper.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Maximum).Value);
      Assert.Contains("**Salary:** NGN Up to 400,000", upper.Description);
      Assert.Equal([CustomFieldConstants.Job.Experience.Options.Mid],
        upper.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Experience.Level).Values!);
      Assert.Equal([CustomFieldConstants.Job.Employment.ScheduleOptions.PartTime],
        upper.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Employment.Schedule).Values!);
      Assert.NotNull(upper.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.MinimumQualification).Values);

      var lower = rows.Single(row => row.Source.ExternalId == "NG:1266854").Mapped;
      Assert.Equal("5000000", lower.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Minimum).Value);
      Assert.Null(lower.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Maximum).Value);
      Assert.Contains("**Salary:** NGN Above 5,000,000", lower.Description);

      var missing = rows.Single(row => row.Source.SourceId == "test-mapping-missing-metadata").Mapped;
      Assert.Equal(missing.Summary, missing.Description);
      Assert.Equal(bool.FalseString, missing.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Disclosed).Value);
      Assert.All(missing.CustomFields!.Where(field => field.Key != CustomFieldConstants.Job.Salary.Disclosed), field =>
      {
        Assert.Null(field.Value);
        Assert.Null(field.Values);
      });
      Assert.Contains(rows, row => row.Source.Salary != null &&
        row.Mapped.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Disclosed).Value == null &&
        row.Mapped.Description.Contains(row.Source.Salary));
      Assert.Contains(rows, row => row.Source.MinimumQualification == "Vocational" &&
        row.Mapped.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.MinimumQualification).Values == null &&
        row.Mapped.Description.Contains("**Minimum qualification:** Vocational"));
      Assert.Contains(rows, row => row.Source.ExperienceLevel == "Senior level" && row.Source.ExperienceLength == "2 years" &&
        row.Mapped.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Experience.Level).Values == null &&
        row.Mapped.Description.Contains("**Experience level:** Senior level"));
      Assert.Contains(rows, row => row.Source.WorkType == "Contract & Temporary" &&
        row.Mapped.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Employment.Type).Values == null &&
        row.Mapped.Description.Contains("**Contract type:** Contract & Temporary"));
      Assert.Contains(rows, row => row.Mapped.CustomFields!.Any(field => field.Key == CustomFieldConstants.Job.Employment.Type &&
        field.Values?.Contains(EmploymentType.Contract.ToString()) == true));
    }

    [Fact]
    public async Task CacheRefreshPersistsSummaryUpdatesAndMarksMissingSamplesDeleted()
    {
      var existing = Assert.Single(Parse(CreateFeed()));
      var originalDate = new DateTimeOffset(2026, 10, 1, 0, 0, 0, TimeSpan.Zero);
      existing.Summary = "Old summary";
      existing.DateStart = originalDate;
      existing.DateCreated = originalDate;
      var removed = new CachedOpportunity { ExternalId = "NG:old", CountryCodeAlpha2 = "NG", Title = "Old sample" };
      var rows = new List<CachedOpportunity> { existing, removed };
      var incoming = Parse(CreateFeed());
      using var context = CreateContext();
      var repository = CreateRepository(rows);
      var service = CreateFeedService(repository, context);

      await Process(service, incoming);

      Assert.Equal("Short role summary.", existing.Summary);
      Assert.Equal(originalDate, existing.DateStart);
      Assert.True(removed.Deleted);
      Assert.Equal(incoming[0].Description, existing.Description);
      repository.Verify(repo => repo.Update(It.Is<List<CachedOpportunity>>(items => items.Count == 2)), Times.Once);

      // The repeated snapshot is unchanged; no redundant persistence is needed.
      repository.Invocations.Clear();
      await Process(service, Parse(CreateFeed()));
      repository.Verify(repo => repo.Update(It.IsAny<List<CachedOpportunity>>()), Times.Never);
    }

    [Fact]
    public async Task CacheRefreshCreatesNewRowsWithSeparateSummaryAndDescription()
    {
      var rows = new List<CachedOpportunity>();
      using var context = CreateContext();
      var repository = CreateRepository(rows);
      var service = CreateFeedService(repository, context);

      await Process(service, Parse(CreateFeed()));

      var created = Assert.Single(rows);
      Assert.Equal("Short role summary.", created.Summary);
      Assert.Contains("Responsibilities", created.Description);
      Assert.DoesNotContain("Responsibilities", created.Summary);
      Assert.NotNull(created.DateStart);
    }

    [Fact]
    public async Task MetadataRemovedFromCompleteFeedDoesNotLeaveStaleSalaryInCache()
    {
      var existing = Assert.Single(Parse(CreateFeed()));
      var rows = new List<CachedOpportunity> { existing };
      var nextFeed = CreateFeed();
      nextFeed.Root!.Element("channel")!.Element("item")!.Element("price")!.Remove();
      using var context = CreateContext();
      var repository = CreateRepository(rows);

      await Process(CreateFeedService(repository, context), Parse(nextFeed));
      var request = await Map(existing);

      Assert.DoesNotContain("**Salary:**", request.Description);
      repository.Verify(repo => repo.Update(It.Is<List<CachedOpportunity>>(items => items.Count == 1)), Times.Once);
    }

    [Fact]
    public async Task EmptySnapshotCannotDeleteExistingRowsOrReviveTerminalRows()
    {
      var terminal = Assert.Single(Parse(CreateFeed()));
      terminal.Deleted = true;
      terminal.Summary = "Terminal summary";
      var active = new CachedOpportunity { ExternalId = "NG:active", CountryCodeAlpha2 = "NG", Title = "Active sample" };
      var rows = new List<CachedOpportunity> { terminal, active };
      using var context = CreateContext();
      var repository = CreateRepository(rows);
      var service = CreateFeedService(repository, context);

      await Process(service, []);
      Assert.NotEqual(true, active.Deleted);
      repository.Verify(repo => repo.Update(It.IsAny<List<CachedOpportunity>>()), Times.Never);

      await Process(service, Parse(CreateFeed()));
      Assert.True(terminal.Deleted);
      Assert.Equal("Terminal summary", terminal.Summary);
    }

    [Fact]
    public void SummaryCacheMigrationAndRepositoryProjectionMatchModelWithoutDatabaseAccess()
    {
      using var context = CreateContext();
      var repository = new Infrastructure.Jobberman.Repositories.OpportunityRepository(context);
      Assert.Contains("Summary", repository.Query().ToQueryString());
      Assert.False(context.Database.HasPendingModelChanges());

      var script = context.GetService<IMigrator>().GenerateScript(
        "20260601104317_JobbermanDb_Opportunity_Indexes",
        "20261019100000_JobbermanDb_Opportunity_FeedMetadata");
      Assert.Contains("ADD \"Summary\" text", script);
      foreach (var field in new[] { "Salary", "ExperienceLevel", "ExperienceLength", "MinimumQualification" })
        Assert.Contains($"ADD \"{field}\" text", script);
      Assert.DoesNotContain("DROP TABLE", script);
    }

    [Theory]
    [InlineData("NGN 1,000 - 2,000", "1000", "2000")]
    [InlineData("USD 150.50", "150.50", "150.50")]
    [InlineData("GHS 50 – 70", "50", "70")]
    public async Task NumericSalaryMapsInvariantBoundsWithoutInventingPayInterval(string salary, string minimum, string maximum)
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.Salary = salary;
      var request = await Map(cached);

      Assert.Equal(minimum, request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Minimum).Value);
      Assert.Equal(maximum, request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Maximum).Value);
      Assert.Equal(CurrencyIds[salary[..3]].ToString(),
        Assert.Single(request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Currency).Values!));
      Assert.DoesNotContain(request.CustomFields!, field => field.Key == CustomFieldConstants.Job.Salary.PayInterval);
      Assert.True(request.Incentivized);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" \t ")]
    public async Task AbsentSalaryIsExplicitlyUndisclosedWithoutImplyingAnUnpaidJob(string? salary)
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.Salary = salary;
      var request = await Map(cached);

      Assert.Equal(bool.FalseString,
        request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Disclosed).Value);
      Assert.All(request.CustomFields!.Where(field => field.Key.StartsWith("JobSalary", StringComparison.Ordinal) &&
        field.Key != CustomFieldConstants.Job.Salary.Disclosed), field =>
        {
          Assert.Null(field.Value);
          Assert.Null(field.Values);
        });
      Assert.Null(request.Incentivized);
      Assert.DoesNotContain("**Salary:**", request.Description);
    }

    [Theory]
    [InlineData("NGN 2,000 - 1,000")]
    [InlineData("NGN 0")]
    [InlineData("NGN -100")]
    [InlineData("NGN 1,2 - 3,4")]
    [InlineData("ZZZ 100 - 200")]
    [InlineData("NGN Above 1,000 - 2,000")]
    [InlineData("NGN Below 0")]
    [InlineData("NGN Up to -100")]
    [InlineData("NGN Above 5,000 monthly")]
    [InlineData("NGN Commission Only")]
    [InlineData("Negotiable")]
    public async Task AmbiguousOrInvalidSalaryStaysReadableAndClearsPreviouslyMappedBounds(string salary)
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.Salary = salary;
      var request = await Map(cached);

      Assert.Contains(salary, request.Description);
      Assert.Null(request.Incentivized);
      Assert.All(request.CustomFields!.Where(field => field.Key.StartsWith("JobSalary", StringComparison.Ordinal)), field =>
      {
        Assert.Null(field.Value);
        Assert.Null(field.Values);
      });
    }

    [Theory]
    [InlineData("NGN Above 5,000,000", "5000000", null)]
    [InlineData("GHS From 150.50", "150.50", null)]
    [InlineData("USD At least 200", "200", null)]
    [InlineData("NGN Over 1,000", "1000", null)]
    [InlineData("NGN Below 5,000,000", null, "5000000")]
    [InlineData("GHS Up to 150.50", null, "150.50")]
    [InlineData("USD At most 200", null, "200")]
    [InlineData("  ngn under 1,000  ", null, "1000")]
    public async Task ExplicitSalaryThresholdMapsOnlyKnownBoundAndRetainsSourceQualifier(string salary, string? minimum, string? maximum)
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.Salary = salary;
      var request = await Map(cached);

      Assert.Equal(minimum, request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Minimum).Value);
      Assert.Equal(maximum, request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Maximum).Value);
      Assert.Equal(bool.TrueString, request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Disclosed).Value);
      Assert.NotNull(request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Salary.Currency).Values);
      Assert.Contains($"**Salary:** {salary.Trim()}", request.Description);
      Assert.DoesNotContain(request.CustomFields!, field => field.Key == CustomFieldConstants.Job.Salary.PayInterval);
      Assert.True(request.Incentivized);
    }

    [Theory]
    [InlineData("Contract")]
    [InlineData("  contract  ")]
    public async Task ContractMapsEmploymentRelationshipWithoutInventingTermOrSchedule(string workType)
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.WorkType = workType;
      var request = await Map(cached);

      Assert.Equal([EmploymentType.Contract.ToString()],
        request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Employment.Type).Values!);
      Assert.Null(request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Employment.Schedule).Values);
      Assert.DoesNotContain(request.CustomFields!, field => field.Key == CustomFieldConstants.Job.Employment.Duration ||
        field.Key == CustomFieldConstants.Job.Employment.DurationUnit);
      Assert.DoesNotContain("**Contract type:**", request.Description);

      cached.WorkType = "Full Time";
      var next = await Map(cached);
      Assert.Null(next.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Employment.Type).Values);
      Assert.Equal([CustomFieldConstants.Job.Employment.ScheduleOptions.FullTime],
        next.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Employment.Schedule).Values!);
    }

    [Theory]
    [InlineData("No Experience", "No Experience/Less than 1 year", CustomFieldConstants.Job.Experience.Options.None)]
    [InlineData("No Experience", "2 years", null)]
    [InlineData("No Experience", "2-3 years", null)]
    [InlineData("Entry level", "2 years", CustomFieldConstants.Job.Experience.Options.EntryJunior)]
    [InlineData("Mid level", "5 years", CustomFieldConstants.Job.Experience.Options.Mid)]
    [InlineData("Senior level", "8 years", CustomFieldConstants.Job.Experience.Options.Senior)]
    [InlineData("Senior level", "2 years", null)]
    [InlineData("Mid level", "3 years", null)]
    [InlineData("Executive level", "10 years", null)]
    [InlineData("Internship & Graduate", "1 year", null)]
    public async Task ExperienceMappingRequiresCompatibleSourceLabelAndYearRange(string level, string length, string? expected)
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.ExperienceLevel = level;
      cached.ExperienceLength = length;
      var request = await Map(cached);
      var field = request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.Experience.Level);

      if (expected == null)
      {
        Assert.Null(field.Values);
        Assert.Contains(level, request.Description);
      }
      else Assert.Equal(expected, Assert.Single(field.Values!));
      Assert.Contains(length, request.Description);
    }

    [Fact]
    public async Task RemovedFeedMetadataClearsOnlyOwnedCustomFieldsAndDoesNotInferEmployment()
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.Salary = null;
      cached.ExperienceLevel = null;
      cached.ExperienceLength = null;
      cached.MinimumQualification = null;
      cached.WorkType = "Contract & Temporary";
      var request = await Map(cached);

      Assert.Equal(8, request.CustomFields!.Count);
      Assert.Equal(bool.FalseString,
        request.CustomFields.Single(field => field.Key == CustomFieldConstants.Job.Salary.Disclosed).Value);
      Assert.All(request.CustomFields.Where(field => field.Key != CustomFieldConstants.Job.Salary.Disclosed), field =>
      {
        Assert.Null(field.Value);
        Assert.Null(field.Values);
      });
      Assert.Null(request.CustomFields.Single(field => field.Key == CustomFieldConstants.Job.Employment.Type).Values);
      Assert.DoesNotContain(request.CustomFields, field => field.Key == CustomFieldConstants.Job.Industry);
      Assert.Contains("Contract & Temporary", request.Description);
      Assert.Null(request.Incentivized);
    }

    [Fact]
    public async Task CacheRefreshUpdatesEveryStructuredFieldAndTheirEffectiveHash()
    {
      var existing = Assert.Single(Parse(CreateFeed()));
      var rows = new List<CachedOpportunity> { existing };
      var opportunityId = Guid.NewGuid();
      var originalHash = HashHelper.ComputeSHA256Hash((await Map(existing)).ToRequestUpdate(opportunityId, applyHidden: false));
      var doc = CreateFeed();
      var item = doc.Root!.Element("channel")!.Element("item")!;
      item.Element("price")!.Value = "USD 500 - 700";
      item.Element("experience_level")!.Value = "Senior level";
      item.Element("experience_length")!.Value = "8 years";
      item.Element("minimum_qualification")!.Value = "Degree";
      using var context = CreateContext();
      var repository = CreateRepository(rows);
      await Process(CreateFeedService(repository, context), Parse(doc));

      Assert.Equal("USD 500 - 700", existing.Salary);
      Assert.Equal("Senior level", existing.ExperienceLevel);
      Assert.Equal("8 years", existing.ExperienceLength);
      Assert.Equal("Degree", existing.MinimumQualification);
      Assert.NotEqual(originalHash, HashHelper.ComputeSHA256Hash((await Map(existing)).ToRequestUpdate(opportunityId, applyHidden: false)));
      repository.Verify(repo => repo.Update(It.IsAny<List<CachedOpportunity>>()), Times.Once);
    }

    [Fact]
    public void InformationalMappingContractsMatchSeedsAndRemainNonSystem()
    {
      var definitions = SeededDefinitions();
      var experience = definitions.Single(definition => definition.Key == CustomFieldConstants.Job.Experience.Level);
      var qualification = definitions.Single(definition => definition.Key == CustomFieldConstants.Job.MinimumQualification);

      Assert.False(experience.IsSystem);
      Assert.False(qualification.IsSystem);
      Assert.All(new[] { CustomFieldConstants.Job.Experience.Options.None, CustomFieldConstants.Job.Experience.Options.EntryJunior,
        CustomFieldConstants.Job.Experience.Options.Mid, CustomFieldConstants.Job.Experience.Options.Senior }, option =>
          Assert.Contains(experience.Options!, value => value.Key == option && value.IsActive));
      Assert.Equal(CustomFieldLookupType.Education, qualification.LookupType);
    }

    [Theory]
    [InlineData("High School (S.S.C.E)", "5642e521-34b9-4dc8-bffa-b975f5c95d99")]
    [InlineData("Diploma", "411fa393-9a65-41f1-9901-8e7ba39bc06c")]
    [InlineData("OND", "411fa393-9a65-41f1-9901-8e7ba39bc06c")]
    [InlineData("HND", "411fa393-9a65-41f1-9901-8e7ba39bc06c")]
    [InlineData("Degree", "d5fc0367-9d17-4dc2-a7d4-77d17e3c02af")]
    [InlineData("MBA / MSc", "28e84f2c-ee70-4e88-883e-eafaec396216")]
    [InlineData("PhD", "f78d77cf-83a4-46df-b145-8c0742cb9d09")]
    [InlineData("  hnd  ", "411fa393-9a65-41f1-9901-8e7ba39bc06c")]
    [InlineData("  degree  ", "d5fc0367-9d17-4dc2-a7d4-77d17e3c02af")]
    public async Task QualificationMappingsResolveAllAliasesToTheirYomaEducationId(string qualification, string expectedId)
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.MinimumQualification = qualification;
      var request = await Map(cached);

      var field = request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.MinimumQualification);
      Assert.Equal(expectedId, Assert.Single(field.Values!));
    }

    [Theory]
    [InlineData("Vocational")]
    [InlineData("MPhil / PhD")]
    [InlineData("Unknown qualification")]
    public async Task AmbiguousQualificationsRemainReadableWithoutFabricatingEducation(string qualification)
    {
      var cached = Assert.Single(Parse(CreateFeed()));
      cached.MinimumQualification = qualification;
      var request = await Map(cached);

      Assert.Contains(qualification, request.Description);
      Assert.Null(request.CustomFields!.Single(field => field.Key == CustomFieldConstants.Job.MinimumQualification).Values);
    }
    #endregion

    #region Private Members
    private static XDocument CreateFeed()
    {
      return new XDocument(new XElement("rss",
        new XAttribute(XNamespace.Xmlns + "content", ContentNamespace.NamespaceName),
        new XElement("channel", new XElement("item",
          new XElement("guid", "123"),
          new XElement("title", "Developer"),
          new XElement("link", "https://www.jobberman.com/listings/developer"),
          new XElement("description", "Short role summary."),
          new XElement(ContentNamespace + "encoded", "<p><strong>Responsibilities</strong></p><ul><li>Build services</li></ul>"),
          new XElement("location", "Lagos, Nigeria"),
          new XElement("price", "NGN 250,000 - 400,000"),
          new XElement("category", "Software & Data"),
          new XElement("work_type", "Full Time"),
          new XElement("experience_level", "Mid level"),
          new XElement("experience_length", "3 years"),
          new XElement("minimum_qualification", "HND")))));
    }

    private static List<CachedOpportunity> Parse(XDocument doc, string country = "NG")
    {
      var method = typeof(OpportunityFeedBackgroundService).GetMethod("ParseOpportunities", BindingFlags.Static | BindingFlags.NonPublic)!;
      var items = (List<CachedOpportunity>)method.Invoke(null, [new JobbermanFeedOptions { CountryCodeAlpha2 = country }, doc])!;
      // A stable stored date ensures hash assertions do not depend on the wall clock.
      items.ForEach(item => item.DateCreated = new DateTimeOffset(2026, 10, 1, 0, 0, 0, TimeSpan.Zero));
      return items;
    }

    private static async Task<OpportunityRequestCreate> Map(CachedOpportunity item)
    {
      var repository = CreateRepository([item]);
      var types = new Mock<IOpportunityTypeService>();
      types.Setup(service => service.GetByName("Job"))
        .Returns(new Domain.Opportunity.Models.Lookups.OpportunityType { Id = Guid.Parse("89331f9c-b411-42aa-aa8e-0bc567d6acfa"), Name = "Job" });
      var categories = new Mock<IOpportunityCategoryService>();
      categories.Setup(service => service.GetByName("Other"))
        .Returns(new Domain.Opportunity.Models.Lookups.OpportunityCategory { Id = OtherCategoryId });
      categories.Setup(service => service.GetById(It.IsAny<Guid>()))
        .Returns((Guid id) => new Domain.Opportunity.Models.Lookups.OpportunityCategory { Id = id });
      var countries = new Mock<ICountryService>();
      countries.Setup(service => service.GetByCodeAlpha2(item.CountryCodeAlpha2))
        .Returns(new Domain.Lookups.Models.Country { Id = CountryId });
      var languages = new Mock<ILanguageService>();
      languages.Setup(service => service.GetByName("English"))
        .Returns(new Domain.Lookups.Models.Language { Id = LanguageId });
      var currencies = new Mock<ICurrencyService>();
      foreach (var currency in CurrencyIds)
      {
        currencies.Setup(service => service.GetByCodeOrNull(currency.Key))
          .Returns(new Domain.Lookups.Models.Currency { Id = currency.Value, Code = currency.Key });
        currencies.Setup(service => service.GetByIdOrNull(currency.Value))
          .Returns(new Domain.Lookups.Models.Currency { Id = currency.Value, Code = currency.Key });
      }
      var education = new Mock<IEducationService>();
      education.Setup(service => service.GetByIdOrNull(It.IsAny<Guid>()))
        .Returns((Guid id) => new Domain.Lookups.Models.Education { Id = id });
      var definitions = SeededDefinitions();
      var customFields = new Mock<ICustomFieldDefinitionService>();
      customFields.Setup(service => service.GetByKey(CustomFieldEntityType.Opportunity, It.IsAny<string>(), true, true))
        .Returns((CustomFieldEntityType _, string key, bool _, bool _) => definitions.Single(definition => definition.Key == key));
      customFields.Setup(service => service.List(CustomFieldEntityType.Opportunity, true, true, "Job"))
        .Returns([.. definitions.Where(definition => definition.EntityType == CustomFieldEntityType.Opportunity.ToString() &&
          (definition.EntityContext == null || definition.EntityContext == "Job"))]);
      var client = new JobbermanClient(
        Mock.Of<ILogger<JobbermanClient>>(),
        Options.Create(new JobbermanOptions { OrganizationIdYoma = OrganizationId, Feeds = [new() { CountryCodeAlpha2 = item.CountryCodeAlpha2 }] }),
        types.Object,
        categories.Object,
        countries.Object,
        languages.Object,
        currencies.Object,
        education.Object,
        customFields.Object,
        repository.Object,
        new SyncFilterPullEntityValidator());
      var result = await client.List(new SyncFilterPullEntity { PageNumber = 1, PageSize = 100 });
      var request = Assert.Single(result.Items).Item;
      request.CustomFields.NormalizeForPatch();
      var valueService = new CustomFieldValueService(customFields.Object, countries.Object, languages.Object,
        Mock.Of<ISkillService>(), education.Object, currencies.Object, Mock.Of<IRepository<CustomFieldValue>>(),
        Mock.Of<IExecutionStrategyService>());
      valueService.Validate(CustomFieldEntityType.Opportunity, "Job", request.CustomFields, CustomFieldUpsertMode.PatchAllowMissingRequired);
      return request;
    }

    private static List<CustomFieldDefinition> SeededDefinitions()
    {
      var operations = new ApplicationDb_CF_Configuration().UpOperations.OfType<InsertDataOperation>().ToList();
      operations.AddRange(new ApplicationDb_Job_Employment_Contract().UpOperations.OfType<InsertDataOperation>());
      var definitions = new List<CustomFieldDefinition>();
      foreach (var operation in operations.Where(operation => operation.Table == "CustomFieldDefinition"))
        for (var row = 0; row < operation.Values.GetLength(0); row++)
        {
          object? Value(string column)
          {
            var index = Array.IndexOf(operation.Columns, column);
            return index < 0 ? null : operation.Values[row, index];
          }
          definitions.Add(new CustomFieldDefinition
          {
            Id = (Guid)Value("Id")!,
            EntityType = (string)Value("EntityType")!,
            EntityContext = (string?)Value("EntityContext"),
            Key = (string)Value("Key")!,
            Title = (string)Value("Title")!,
            DataType = Enum.Parse<CustomFieldDataType>((string)Value("DataType")!),
            LookupType = Value("LookupType") is string lookup ? Enum.Parse<CustomFieldLookupType>(lookup) : null,
            IsActive = (bool)Value("IsActive")!,
            IsSystem = (bool)Value("IsSystem")!,
            IsRequired = Value("IsRequired") is true,
            SupportsMultiple = (bool?)Value("SupportsMultiple"),
            Options = []
          });
        }

      foreach (var operation in operations.Where(operation => operation.Table == "CustomFieldOption"))
        for (var row = 0; row < operation.Values.GetLength(0); row++)
        {
          object? Value(string column) => operation.Values[row, Array.IndexOf(operation.Columns, column)];
          definitions.Single(definition => definition.Id == (Guid)Value("CustomFieldDefinitionId")!).Options!.Add(new CustomFieldOption
          {
            Key = (string)Value("Key")!,
            Name = (string)Value("Name")!,
            IsActive = (bool)Value("IsActive")!
          });
        }

      return definitions;
    }

    private static Mock<IRepositoryBatched<CachedOpportunity>> CreateRepository(List<CachedOpportunity> rows)
    {
      var repository = new Mock<IRepositoryBatched<CachedOpportunity>>();
      repository.Setup(repo => repo.Query()).Returns(() => rows.AsQueryable());
      repository.Setup(repo => repo.Create(It.IsAny<List<CachedOpportunity>>()))
        .Callback<List<CachedOpportunity>>(items => rows.AddRange(items))
        .ReturnsAsync((List<CachedOpportunity> items) => items);
      repository.Setup(repo => repo.Update(It.IsAny<List<CachedOpportunity>>()))
        .ReturnsAsync((List<CachedOpportunity> items) => items);
      return repository;
    }

    private static JobbermanDbContext CreateContext()
    {
      return new JobbermanDbContext(new DbContextOptionsBuilder<JobbermanDbContext>()
        .UseNpgsql("Host=localhost;Database=unused_jobberman_mapping_test;Username=unused;Password=unused")
        .Options);
    }

    private static OpportunityFeedBackgroundService CreateFeedService(
      Mock<IRepositoryBatched<CachedOpportunity>> repository,
      JobbermanDbContext context)
    {
      return new OpportunityFeedBackgroundService(
        Mock.Of<ILogger<OpportunityFeedBackgroundService>>(),
        Mock.Of<IEnvironmentProvider>(),
        Options.Create(new JobbermanOptions { RetentionDays = -1 }),
        Options.Create(new AppSettings()),
        Options.Create(new ScheduleJobOptions()),
        Mock.Of<IHttpClientFactory>(),
        repository.Object,
        Mock.Of<IRepository<FeedTracking>>(),
        Mock.Of<IDistributedLockService>(),
        new ExecutionStrategyService(context),
        Mock.Of<Microsoft.Extensions.Hosting.IHostApplicationLifetime>());
    }

    private static Task Process(OpportunityFeedBackgroundService service, List<CachedOpportunity> items)
    {
      var method = typeof(OpportunityFeedBackgroundService).GetMethod("ProcessOpportunities", BindingFlags.Instance | BindingFlags.NonPublic)!;
      return (Task)method.Invoke(service, [new JobbermanFeedOptions { CountryCodeAlpha2 = "NG" }, items, DateTimeOffset.UtcNow])!;
    }
    #endregion
  }
}
