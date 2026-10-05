using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using System.Net;
using Xunit;
using Yoma.Core.Api.Controllers;
using Yoma.Core.Api.Middleware;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.LaborMarketProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Lookups.Services;
using Yoma.Core.Domain.Lookups.Validators;

namespace Yoma.Core.Test.Lookups
{
  public class SkillServiceTests
  {
    [Fact]
    public async Task HttpLookupBindsIdArrayAndReturnsOnlySelectedSkillsWithoutPagination()
    {
      using var fixture = new Fixture(true, "Python", "Java", "Python Imaging");
      await using var app = await CreateApplication(fixture.Service);
      using var client = app.GetTestClient();
      var python = fixture.Service.GetByName("Python");
      var imaging = fixture.Service.GetByName("Python Imaging");

      using var body = new StringContent(JsonConvert.SerializeObject(new[] { imaging.Id, python.Id, python.Id }),
        System.Text.Encoding.UTF8, "application/json");
      using var response = await client.PostAsync("/api/v3/lookup/skill/ids", body, TestContext.Current.CancellationToken);

      Assert.Equal(HttpStatusCode.OK, response.StatusCode);
      var result = JsonConvert.DeserializeObject<List<Skill>>(
        await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
      Assert.NotNull(result);
      Assert.Equal(2, result.Count);
      Assert.Equal(new[] { python.Id, imaging.Id }, result.Select(item => item.Id));
    }

    [Theory]
    [InlineData("[]")]
    [InlineData("null")]
    [InlineData("[\"not-a-guid\"]")]
    [InlineData("[\"00000000-0000-0000-0000-000000000000\"]")]
    [InlineData("{\"ids\":[\"00000000-0000-0000-0000-000000000001\"]}")]
    public async Task HttpLookupRejectsInvalidIdsAndIncorrectBodyShape(string json)
    {
      using var fixture = new Fixture(false, "Python");
      await using var app = await CreateApplication(fixture.Service);
      using var client = app.GetTestClient();
      using var body = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
      using var response = await client.PostAsync("/api/v3/lookup/skill/ids", body,
        TestContext.Current.CancellationToken);

      Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task HttpLookupRejectsMissingBody()
    {
      using var fixture = new Fixture(false, "Python");
      await using var app = await CreateApplication(fixture.Service);
      using var client = app.GetTestClient();
      using var missing = await client.PostAsync("/api/v3/lookup/skill/ids", null,
        TestContext.Current.CancellationToken);
      Assert.Equal(HttpStatusCode.UnsupportedMediaType, missing.StatusCode);

      using var emptyBody = new StringContent(string.Empty, System.Text.Encoding.UTF8, "application/json");
      using var empty = await client.PostAsync("/api/v3/lookup/skill/ids", emptyBody,
        TestContext.Current.CancellationToken);
      Assert.Equal(HttpStatusCode.BadRequest, empty.StatusCode);
    }

    [Fact]
    public async Task HttpLookupReturnsAllRequestedSkillsBeyondTheFormerLimit()
    {
      using var fixture = new Fixture(true,
        [.. Enumerable.Range(1, 1501).Select(index => $"Skill {index:D4}")]);
      await using var app = await CreateApplication(fixture.Service);
      using var client = app.GetTestClient();
      var ids = fixture.Service.Contains("Skill").Select(skill => skill.Id).ToList();
      using var body = new StringContent(JsonConvert.SerializeObject(ids), System.Text.Encoding.UTF8, "application/json");

      using var response = await client.PostAsync("/api/v3/lookup/skill/ids", body,
        TestContext.Current.CancellationToken);
      Assert.Equal(HttpStatusCode.OK, response.StatusCode);
      var result = JsonConvert.DeserializeObject<List<Skill>>(
        await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));

      Assert.NotNull(result);
      Assert.Equal(ids, result.Select(skill => skill.Id));
    }

    [Fact]
    public void SharedLookupIdsValidatorIsRegisteredByTheDomainStartup()
    {
      var services = new ServiceCollection();
      Domain.Startup.ConfigureServices_DomainServices(services);
      using var provider = services.BuildServiceProvider();
      using var scope = provider.CreateScope();

      Assert.IsType<LookupIdsValidator>(scope.ServiceProvider.GetRequiredService<LookupIdsValidator>());
    }

    [Theory]
    [InlineData("nameContains=python")]
    [InlineData("pageNumber=0&pageSize=10")]
    [InlineData("pageNumber=1")]
    [InlineData("pageNumber=1&pageSize=1001")]
    public async Task HttpNameSearchStillRequiresValidPagination(string query)
    {
      using var fixture = new Fixture(false, "Python");
      await using var app = await CreateApplication(fixture.Service);
      using var client = app.GetTestClient();
      using var response = await client.GetAsync($"/api/v3/lookup/skill?{query}",
        TestContext.Current.CancellationToken);

      Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task HttpNameSearchKeepsItsPagedResponse()
    {
      using var fixture = new Fixture(false, "Python", "Python Imaging", "Java");
      await using var app = await CreateApplication(fixture.Service);
      using var client = app.GetTestClient();
      using var response = await client.GetAsync("/api/v3/lookup/skill?nameContains=python&pageNumber=2&pageSize=1",
        TestContext.Current.CancellationToken);
      Assert.Equal(HttpStatusCode.OK, response.StatusCode);
      var result = JsonConvert.DeserializeObject<SkillSearchResults>(
        await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));

      Assert.NotNull(result);
      Assert.Equal(2, result.TotalCount);
      Assert.Equal("Python Imaging", Assert.Single(result.Items).Name);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void LookupResolvesSelectedIdsOutsideTheFirstCataloguePage(bool cached)
    {
      using var fixture = new Fixture(cached,
        [.. Enumerable.Range(1, 601).Select(index => $"Skill {index:D4}")]);
      var selected = fixture.Service.GetByName("Skill 0601");
      var first = fixture.Service.GetByName("Skill 0001");

      var result = fixture.Service.ListByIds([selected.Id, first.Id, selected.Id, Guid.NewGuid()]);

      Assert.Equal(2, result.Count);
      Assert.Equal(new[] { first.Id, selected.Id }, result.Select(item => item.Id));
    }

    [Fact]
    public void SearchFiltersNameBeforeCountingAndPaging()
    {
      using var fixture = new Fixture(false, "Python", "Python Imaging", "Python Server", "Java");

      var result = fixture.Service.Search(new SkillSearchFilter
      {
        NameContains = "Python",
        PageNumber = 2,
        PageSize = 1
      });

      Assert.Equal(3, result.TotalCount);
      Assert.Equal("Python Imaging", Assert.Single(result.Items).Name);
    }

    [Fact]
    public void LookupWithOnlyUnknownIdsReturnsAnEmptyList()
    {
      using var fixture = new Fixture(true, "Python");
      var result = fixture.Service.ListByIds([Guid.NewGuid()]);

      Assert.Empty(result);
    }

    [Fact]
    public void SearchPreservesOrdinaryNameSearch()
    {
      using var fixture = new Fixture(true, "Python", "Java", "Python Imaging");
      var result = fixture.Service.Search(new SkillSearchFilter
      {
        NameContains = "python",
        PageNumber = 1,
        PageSize = 10
      });

      Assert.Equal(2, result.TotalCount);
      Assert.Equal(new[] { "Python", "Python Imaging" }, result.Items.Select(item => item.Name));
    }

    [Fact]
    public void LookupRejectsEmptyAndInvalidIdsBeforeResolution()
    {
      using var fixture = new Fixture(false, "Python");

      List<Guid>[] invalidSelections =
      [
        [],
        [Guid.Empty]
      ];

      foreach (var ids in invalidSelections)
      {
        Assert.Throws<ValidationException>(() => fixture.Service.ListByIds(ids));
      }

      Assert.Throws<ArgumentNullException>(() => fixture.Service.ListByIds(null!));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void LookupReturnsEveryRequestedSkillBeyondTheFormerLimitWithoutPagination(bool cached)
    {
      using var fixture = new Fixture(cached,
        [.. Enumerable.Range(1, 1501).Select(index => $"Skill {index:D4}")]);
      var ids = fixture.Service.Contains("Skill").Select(skill => skill.Id).ToList();

      var result = fixture.Service.ListByIds(ids);

      Assert.Equal(ids.Count, result.Count);
      Assert.Equal(ids, result.Select(skill => skill.Id));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void LookupDeduplicatesLargeSelectionsWithoutLimitingTheInput(bool cached)
    {
      using var fixture = new Fixture(cached, "Python");
      var skill = fixture.Service.GetByName("Python");
      var ids = Enumerable.Repeat(skill.Id, 1501).ToList();

      var result = fixture.Service.ListByIds(ids);

      Assert.Equal(skill.Id, Assert.Single(result).Id);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void ExactNamesWinAndUnsafeParentheticalAliasesAreIgnored(bool cached)
    {
      using var fixture = new Fixture(cached, "Geospatial Information Technology (GIT)",
        "ActiveXObject (JavaScript)", "Framing (HTML)", "DataCapture (SQL)", "Git", "JavaScript");

      Assert.Equal("Git", fixture.Service.GetByNameNormalizedOrNull(" GIT ")?.Name);
      Assert.Equal("JavaScript", fixture.Service.GetByNameNormalizedOrNull("javascript")?.Name);
      Assert.Null(fixture.Service.GetByNameNormalizedOrNull("HTML"));
      Assert.Null(fixture.Service.GetByNameNormalizedOrNull("SQL"));
      Assert.Equal("Framing (HTML)", fixture.Service.GetByNameNormalizedOrNull("Framing (HTML)")?.Name);
      // Exercise the same lookup again after it has been cached.
      Assert.Equal("Git", fixture.Service.GetByNameNormalizedOrNull("git")?.Name);
    }

    [Theory]
    [InlineData("Git", "Geospatial Information Technology (GIT)")]
    [InlineData("JavaScript", "ActiveXObject (JavaScript)")]
    [InlineData("Python", "Python 3")]
    [InlineData("Python 2", "Python 3")]
    [InlineData("Python (Snake)", "Python (Programming Language)")]
    public void DoesNotInferUnrelatedSkills(string input, string name)
    {
      using var fixture = new Fixture(true, name);
      Assert.Null(fixture.Service.GetByNameNormalizedOrNull(input));
    }

    [Theory]
    [InlineData("Python", "Python (Programming Language)")]
    [InlineData("community-outreach", "Community Outreach")]
    [InlineData("CommunityOutreach", "Community Outreach")]
    [InlineData("Research &amp; Development", "Research and Development")]
    [InlineData("Research Development", "Research and Development")]
    [InlineData("C sharp", "C#")]
    [InlineData("C plus plus", "C++")]
    public void PreservesUnambiguousFormattingAndBaseNameMatches(string input, string name)
    {
      using var fixture = new Fixture(true, name);
      Assert.Equal(name, fixture.Service.GetByNameNormalizedOrNull(input)?.Name);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void AmbiguousAliasesNeverPickTheFirstSkill(bool cached)
    {
      using var fixture = new Fixture(cached, "Python (Programming Language)", "Python (Snake)",
        "A B C", "AB C", "Research and Development", "Research Development");

      Assert.Null(fixture.Service.GetByNameNormalizedOrNull("Python"));
      Assert.Null(fixture.Service.GetByNameNormalizedOrNull("A BC"));
      Assert.Equal("AB C", fixture.Service.GetByNameNormalizedOrNull("AB C")?.Name);
      Assert.Equal("Research and Development",
        fixture.Service.GetByNameNormalizedOrNull("Research & Development")?.Name);
      Assert.Equal("Research Development",
        fixture.Service.GetByNameNormalizedOrNull("Research Development")?.Name);
    }

    [Fact]
    public void NormalizedFullNameCollisionsAreNotResolvedByOrder()
    {
      using var fixture = new Fixture(true, "Data-Analysis", "Data Analysis");
      Assert.Null(fixture.Service.GetByNameNormalizedOrNull("Data_Analysis"));
      Assert.Equal("Data-Analysis", fixture.Service.GetByNameNormalizedOrNull("Data-Analysis")?.Name);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void EmptyNamesRemainInvalid(string? input)
    {
      using var fixture = new Fixture(false, "Python");
      Assert.Throws<ArgumentNullException>(() => fixture.Service.GetByNameNormalizedOrNull(input!));
    }

    private static async Task<WebApplication> CreateApplication(ISkillService skills)
    {
      var builder = WebApplication.CreateBuilder();
      builder.WebHost.UseTestServer();

      var services = builder.Services;
      services.AddSingleton(skills);
      services.AddSingleton(Mock.Of<ITargetedGroupService>());
      services.AddSingleton(Mock.Of<ISustainableDevelopmentGoalService>());
      services.AddSingleton(Mock.Of<ICurrencyService>());
      services.AddSingleton(Mock.Of<IAccessibilityService>());
      services.AddSingleton(Mock.Of<ICountryService>());
      services.AddSingleton(Mock.Of<IEducationService>());
      services.AddSingleton(Mock.Of<IEngagementTypeService>());
      services.AddSingleton(Mock.Of<IGenderService>());
      services.AddSingleton(Mock.Of<ILanguageService>());
      services.AddSingleton(Mock.Of<ITimeIntervalService>());
      services.AddControllers()
        .AddApplicationPart(typeof(LookupController).Assembly)
        .AddNewtonsoftJson();

      var app = builder.Build();
      app.UseMiddleware<ExceptionResponseMiddleware>();
      app.MapControllers();

      await app.StartAsync(TestContext.Current.CancellationToken);
      return app;
    }

    private sealed class Fixture : IDisposable
    {
      private readonly MemoryCache _cache = new(new MemoryCacheOptions());
      public SkillService Service { get; }

      public Fixture(bool cached, params string[] names)
      {
        var skills = names.Select(name => new Skill { Id = Guid.NewGuid(), Name = name }).ToList();
        var repository = new Mock<IRepositoryBatchedValueContains<Skill>>();
        repository.Setup(o => o.Query()).Returns(skills.AsQueryable());
        var factory = new Mock<ILaborMarketProviderClientFactory>();
        factory.Setup(o => o.CreateClient()).Returns(Mock.Of<ILaborMarketProviderClient>());
        Service = new SkillService(NullLogger<SkillService>.Instance,
          Options.Create(new AppSettings
          {
            CacheEnabledByCacheItemTypes = cached ? "Lookups" : "",
            CacheSlidingExpirationInHours = 1,
            CacheAbsoluteExpirationRelativeToNowInDays = 1
          }), Options.Create(new ScheduleJobOptions()), _cache, factory.Object,
          new LookupIdsValidator(), new SkillSearchFilterValidator(), repository.Object, Mock.Of<IDistributedLockService>());
      }

      public void Dispose() => _cache.Dispose();
    }
  }
}
