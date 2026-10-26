using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Npgsql;
using System.Data.Common;
using System.Reflection;
using System.Security.Claims;
using FluentValidation;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.Opportunity.Services.Lookups;
using Yoma.Core.Domain.Opportunity.Validators;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.Treasury.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Opportunity.Repositories;
using Category = Yoma.Core.Domain.Opportunity.Models.Lookups.OpportunityCategory;
using CategoryLookupRepository = Yoma.Core.Infrastructure.Database.Opportunity.Repositories.Lookups.OpportunityCategoryRepository;
using OrganizationStatus = Yoma.Core.Domain.Entity.OrganizationStatus;
using OpportunityModel = Yoma.Core.Domain.Opportunity.Models.Opportunity;

namespace Yoma.Core.Test.OpportunitySearch
{
  public class OpportunityCategoryFilterTests
  {
    #region Class Variables
    private static readonly string[] _publishedStateScenarios =
      ["default", "empty", "active", "future", "expired", "active-future", "active-expired", "future-expired", "all", "duplicates"];
    private static readonly string[] _organizationScenarios = ["all", "empty", "one", "multiple", "duplicates", "no-opportunities"];
    #endregion

    #region Tests
    [Theory]
    [InlineData("default")]
    [InlineData("empty")]
    [InlineData("active")]
    [InlineData("future")]
    [InlineData("expired")]
    [InlineData("active-future")]
    [InlineData("active-expired")]
    [InlineData("future-expired")]
    [InlineData("all")]
    [InlineData("duplicates")]
    public void PreservesVisibilityCountsMetadataAndOrdering(string scenario)
    {
      var fixture = new Fixture();
      var states = States(scenario);
      var originalStates = states?.ToArray();

      var result = fixture.Service.ListOpportunitySearchCriteriaCategories(states);

      AssertResults(fixture, states, result);
      Assert.Equal(originalStates, states?.ToArray());
      fixture.Mappings.Verify(repository => repository.Query(), Times.Once);
      fixture.Opportunities.VerifyNoOtherCalls();
    }

    [Fact]
    public void ReturnsNoCategoriesWhenNothingIsVisible()
    {
      var fixture = new Fixture();
      fixture.Rows.Clear();

      Assert.Empty(fixture.Service.ListOpportunitySearchCriteriaCategories(null));
      fixture.Opportunities.VerifyNoOtherCalls();
    }

    [Fact]
    public void DoesNotStartPerCategorySearchesAsCategoryCountGrows()
    {
      var fixture = new Fixture();
      for (var index = 0; index < 100; index++)
      {
        var category = fixture.AddCategory($"Category {index:D3}");
        fixture.Add(Status.Active, -1, null, true, category);
      }

      var result = fixture.Service.ListOpportunitySearchCriteriaCategories(null);

      AssertResults(fixture, null, result);
      fixture.Mappings.Verify(repository => repository.Query(), Times.Once);
      fixture.Opportunities.VerifyNoOtherCalls();
    }

    [Fact]
    public void RejectsUnsupportedPublishedStates()
    {
      var fixture = new Fixture();

      Assert.Throws<InvalidOperationException>(() =>
        fixture.Service.ListOpportunitySearchCriteriaCategories([(PublishedState)999]));
      fixture.Opportunities.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("all")]
    [InlineData("empty")]
    [InlineData("one")]
    [InlineData("multiple")]
    [InlineData("duplicates")]
    [InlineData("no-opportunities")]
    public void AdminPreservesOrganisationScopeAndIncludesHiddenAndInactiveItems(string scenario)
    {
      var fixture = new Fixture();
      var organizations = Organizations(fixture, scenario);
      var original = organizations?.ToArray();

      var result = fixture.Service.ListOpportunitySearchCriteriaCategoriesAdmin(organizations, false);

      AssertAdminResults(fixture, organizations, result);
      Assert.Equal(original, organizations?.ToArray());
      fixture.Mappings.Verify(repository => repository.Query(), Times.Once);
      fixture.Opportunities.VerifyNoOtherCalls();
      if (organizations is { Count: > 0 })
        fixture.Organizations.Verify(service => service.EnsureExist(
          It.Is<List<Guid>>(ids => ids.SequenceEqual(organizations.Distinct())), true), Times.Once);
      else
        fixture.Organizations.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void OrganisationAdminStillRequiresAnExplicitSelectionBeforeAnyQuery(bool empty)
    {
      var fixture = new Fixture();
      fixture.SetRole(Constants.Role_OrganizationAdmin);

      var error = Assert.Throws<ValidationException>(() =>
        fixture.Service.ListOpportunitySearchCriteriaCategoriesAdmin(empty ? [] : null, true));

      Assert.Equal($"One or more organizations are required for '{Constants.Role_OrganizationAdmin}' role only", error.Message);
      fixture.Mappings.VerifyNoOtherCalls();
      fixture.Opportunities.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(Constants.Role_Admin, false)]
    [InlineData(Constants.Role_Admin, true)]
    [InlineData(Constants.Role_OrganizationAdmin, true)]
    public void AdminRoleAndExistenceChecksRemainUnchanged(string role, bool selected)
    {
      var fixture = new Fixture();
      fixture.SetRole(role);
      var organizations = selected ? Organizations(fixture, "multiple") : null;

      AssertAdminResults(fixture, organizations, fixture.Service.ListOpportunitySearchCriteriaCategoriesAdmin(organizations, true));
    }

    [Fact]
    public void InvalidOrganisationStillFailsBeforeAnyQuery()
    {
      var fixture = new Fixture();
      var error = new ValidationException("Organization does not exist");
      fixture.Organizations.Setup(service => service.EnsureExist(It.IsAny<List<Guid>>(), true)).Throws(error);

      Assert.Same(error, Assert.Throws<ValidationException>(() =>
        fixture.Service.ListOpportunitySearchCriteriaCategoriesAdmin([Guid.NewGuid()], false)));
      fixture.Mappings.VerifyNoOtherCalls();
      fixture.Opportunities.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PostgreSqlMatchesExistingSearchCountsWithConstantQueryCount()
    {
      var connectionString = System.Environment.GetEnvironmentVariable("YOMA_CATEGORY_FILTER_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(connectionString),
        "Set YOMA_CATEGORY_FILTER_TEST_CONNECTION to an isolated local yoma_category_filter_* database.");
      var builder = new NpgsqlConnectionStringBuilder(connectionString);
      Assert.True(builder.Host is "localhost" or "127.0.0.1");
      Assert.StartsWith("yoma_category_filter_", builder.Database);
      var recorder = new CommandRecorder();
      await using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(builder.ConnectionString, options => options.EnableRetryOnFailure())
        .AddInterceptors(recorder)
        .Options);
      await context.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
      await context.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
      {
        context.ChangeTracker.Clear();
        await using var transaction = await context.Database.BeginTransactionAsync(TestContext.Current.CancellationToken);
        var fixture = new Fixture();
        for (var index = 0; index < 30; index++)
        {
          var category = fixture.AddCategory($"Category {index:D2}");
          for (var count = 0; count < 20; count++)
            fixture.Add(Status.Active, -1, false, true, category);
        }
        await Seed(context, fixture);

        using var cache = new MemoryCache(new MemoryCacheOptions());
        var categoryService = new OpportunityCategoryService(
          Options.Create(new AppSettings
          {
            CacheEnabledByCacheItemTypes = "Lookups",
            CacheSlidingExpirationInHours = 1,
            CacheAbsoluteExpirationRelativeToNowInDays = 1
          }), cache, new CategoryLookupRepository(context));
        fixture = new Fixture(fixture, new OpportunityCategoryRepository(context).Query(),
          new OpportunityRepository(context).Query(true), categoryService);

        foreach (var scenario in _publishedStateScenarios)
        {
          var states = States(scenario);
          recorder.Commands.Clear();
          var results = fixture.Service.ListOpportunitySearchCriteriaCategories(states);

          AssertResults(fixture, states, results);
          Assert.Equal(scenario == "default" ? 2 : 1, recorder.Commands.Count);
          var aggregate = Assert.Single(recorder.Commands, sql => sql.Contains("GROUP BY", StringComparison.Ordinal));
          Assert.Contains("count(DISTINCT", aggregate, StringComparison.OrdinalIgnoreCase);
          Assert.DoesNotContain("EXISTS", aggregate, StringComparison.OrdinalIgnoreCase);
          fixture.Opportunities.Verify(repository => repository.Query(It.IsAny<bool>()), Times.Never);

          // Compare with the real existing search/count path, not only the in-memory expectation.
          foreach (var category in fixture.Categories)
          {
            var filter = new OpportunitySearchFilterAdmin { Categories = [category.Id] };
            SetInternalFilter(filter, "TotalCountOnly", true);
            SetInternalFilter(filter, "PublishedStates", states is { Count: > 0 } ? states : [PublishedState.NotStarted, PublishedState.Active]);
            SetInternalFilter(filter, "ExcludeHidden", true);
            var expected = fixture.Service.Search(filter, false).TotalCount;
            Assert.Equal(expected, results.SingleOrDefault(item => item.Id == category.Id)?.Count ?? 0);
          }
          fixture.Opportunities.Invocations.Clear();
        }

        foreach (var scenario in _organizationScenarios)
        {
          var organizations = Organizations(fixture, scenario);
          recorder.Commands.Clear();

          var results = fixture.Service.ListOpportunitySearchCriteriaCategoriesAdmin(organizations, false);

          AssertAdminResults(fixture, organizations, results);
          var sql = Assert.Single(recorder.Commands);
          Assert.Contains("GROUP BY", sql, StringComparison.Ordinal);
          Assert.Contains("count(DISTINCT", sql, StringComparison.OrdinalIgnoreCase);
          fixture.Opportunities.Verify(repository => repository.Query(It.IsAny<bool>()), Times.Never);
          foreach (var category in fixture.Categories)
          {
            var filter = new OpportunitySearchFilterAdmin { Organizations = organizations, Categories = [category.Id] };
            SetInternalFilter(filter, "TotalCountOnly", true);
            Assert.Equal(fixture.Service.Search(filter, false).TotalCount,
              results.SingleOrDefault(item => item.Id == category.Id)?.Count ?? 0);
          }
          fixture.Opportunities.Invocations.Clear();
        }

        await transaction.RollbackAsync(TestContext.Current.CancellationToken);
      });
    }
    #endregion

    #region Private Members
    private static List<Guid>? Organizations(Fixture fixture, string scenario)
      => scenario switch
      {
        "all" => null,
        "empty" => [],
        "one" => [fixture.Rows[0].OrganizationId],
        "multiple" => [fixture.Rows[0].OrganizationId, fixture.Rows[2].OrganizationId, fixture.Rows[^1].OrganizationId],
        "duplicates" => [fixture.Rows[0].OrganizationId, fixture.Rows[0].OrganizationId],
        "no-opportunities" => [Guid.NewGuid()],
        _ => throw new NotSupportedException($"Scenario '{scenario}' is not supported")
      };

    private static void AssertAdminResults(Fixture fixture, List<Guid>? organizations, List<Category> actual)
    {
      var counts = fixture.Rows.Where(row => organizations is not { Count: > 0 } || organizations.Contains(row.OrganizationId))
        .GroupBy(row => row.CategoryId)
        .ToDictionary(group => group.Key, group => group.Select(row => row.OpportunityId).Distinct().Count());
      var expected = fixture.Categories.Where(category => counts.ContainsKey(category.Id))
        .OrderBy(category => category.Name == Domain.Opportunity.Category.Other.ToString()).ThenBy(category => category.Name).ToList();
      Assert.Equal(expected.Select(category => (category.Id, category.Name, category.ImageURL, counts[category.Id])),
        actual.Select(category => (category.Id, category.Name, category.ImageURL, category.Count!.Value)));
    }

    private static List<PublishedState>? States(string scenario)
      => scenario switch
      {
        "default" => null,
        "empty" => [],
        "active" => [PublishedState.Active],
        "future" => [PublishedState.NotStarted],
        "expired" => [PublishedState.Expired],
        "active-future" => [PublishedState.Active, PublishedState.NotStarted],
        "active-expired" => [PublishedState.Active, PublishedState.Expired],
        "future-expired" => [PublishedState.NotStarted, PublishedState.Expired],
        "all" => [PublishedState.Active, PublishedState.NotStarted, PublishedState.Expired],
        "duplicates" => [PublishedState.Active, PublishedState.Active, PublishedState.NotStarted],
        _ => throw new NotSupportedException($"Scenario '{scenario}' is not supported")
      };

    private static void AssertResults(Fixture fixture, List<PublishedState>? states, List<Category> actual)
    {
      var requested = states is { Count: > 0 } ? states : [PublishedState.NotStarted, PublishedState.Active];
      var now = DateTimeOffset.UtcNow;
      var expected = fixture.Categories.Select(category => new
      {
        Category = category,
        Count = fixture.Rows.Where(row => row.CategoryId == category.Id && row.OrganizationStatusId == Fixture.OrganizationActiveId &&
          row.OpporunityHidden != true && requested.Any(state => state switch
          {
            PublishedState.Active => row.OpportunityStatusId == Fixture.ActiveId && row.OpportunityDateStart <= now,
            PublishedState.NotStarted => row.OpportunityStatusId == Fixture.ActiveId && row.OpportunityDateStart > now,
            PublishedState.Expired => row.OpportunityStatusId == Fixture.ExpiredId,
            _ => throw new NotSupportedException($"Published state '{state}' is not supported")
          })).Select(row => row.OpportunityId).Distinct().Count()
      }).Where(item => item.Count > 0)
        .OrderBy(item => item.Category.Name == Domain.Opportunity.Category.Other.ToString())
        .ThenBy(item => item.Category.Name).ToList();

      Assert.Equal(expected.Select(item => (item.Category.Id, item.Category.Name, item.Category.ImageURL, item.Count)),
        actual.Select(item => (item.Id, item.Name, item.ImageURL, item.Count!.Value)));
    }

    private static void SetInternalFilter(OpportunitySearchFilterAdmin filter, string property, object value)
      => typeof(OpportunitySearchFilterBase).GetProperty(property, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!
        .SetValue(filter, value);

    private static async Task Seed(ApplicationDbContext context, Fixture fixture)
    {
      var now = DateTimeOffset.UtcNow;
      var userId = Guid.NewGuid();
      context.Add(new Infrastructure.Database.Entity.Entities.User { Id = userId, DateCreated = now, DateModified = now });
      foreach (var state in new[] { OrganizationStatus.Active, OrganizationStatus.Inactive })
        context.Add(new Infrastructure.Database.Entity.Entities.Lookups.OrganizationStatus
        { Id = state == OrganizationStatus.Active ? Fixture.OrganizationActiveId : Fixture.OrganizationInactiveId, Name = state.ToString() });
      foreach (var state in Enum.GetValues<Status>())
        context.Add(new Infrastructure.Database.Opportunity.Entities.Lookups.OpportunityStatus { Id = Fixture.StatusIds[state], Name = state.ToString() });
      var typeId = Guid.NewGuid();
      context.Add(new Infrastructure.Database.Opportunity.Entities.Lookups.OpportunityType
      { Id = typeId, Name = Domain.Opportunity.Type.Learning.ToString(), DisplayName = "Learning" });
      foreach (var category in fixture.Categories)
        context.Add(new Infrastructure.Database.Opportunity.Entities.Lookups.OpportunityCategory
        { Id = category.Id, Name = category.Name, ImageURL = category.ImageURL });
      foreach (var row in fixture.Rows.DistinctBy(item => item.OrganizationId))
        context.Add(new Infrastructure.Database.Entity.Entities.Organization
        {
          Id = row.OrganizationId,
          Name = row.OrganizationId.ToString(),
          NameHashValue = row.OrganizationId.ToString(),
          StatusId = row.OrganizationStatusId,
          CreatedByUserId = userId,
          ModifiedByUserId = userId,
          DateCreated = now,
          DateModified = now
        });
      foreach (var row in fixture.Rows.DistinctBy(item => item.OpportunityId))
        context.Add(new Infrastructure.Database.Opportunity.Entities.Opportunity
        {
          Id = row.OpportunityId,
          Title = row.OpportunityId.ToString(),
          Description = "Category filter regression",
          OrganizationId = row.OrganizationId,
          TypeId = typeId,
          StatusId = row.OpportunityStatusId,
          DateStart = row.OpportunityDateStart,
          DateEnd = row.OpportunityDateStart.AddHours(1),
          Hidden = row.OpporunityHidden,
          CreatedByUserId = userId,
          ModifiedByUserId = userId,
          DateCreated = now,
          DateModified = now
        });
      foreach (var row in fixture.Rows)
        context.Add(new Infrastructure.Database.Opportunity.Entities.OpportunityCategory
        { Id = row.Id, OpportunityId = row.OpportunityId, CategoryId = row.CategoryId, DateCreated = now });
      await context.SaveChangesAsync(TestContext.Current.CancellationToken);
      context.ChangeTracker.Clear();
    }
    #endregion

    #region Fixture
    private sealed class Fixture
    {
      internal static readonly Guid OrganizationActiveId = Guid.NewGuid();
      internal static readonly Guid OrganizationInactiveId = Guid.NewGuid();
      internal static readonly Dictionary<Status, Guid> StatusIds = Enum.GetValues<Status>().ToDictionary(state => state, _ => Guid.NewGuid());
      internal static Guid ActiveId => StatusIds[Status.Active];
      internal static Guid ExpiredId => StatusIds[Status.Expired];
      internal List<OpportunityCategory> Rows { get; } = [];
      internal List<Category> Categories { get; } = [];
      internal Mock<IRepository<OpportunityCategory>> Mappings { get; } = new();
      internal Mock<IOrganizationService> Organizations { get; } = new();
      private readonly HttpContextAccessor _http = new() { HttpContext = new DefaultHttpContext() };
      internal Mock<IRepositoryBatchedValueContainsWithNavigationAndCustomFieldFilter<OpportunityModel>> Opportunities { get; } = new();
      internal OpportunityService Service { get; }

      internal Fixture(Fixture? source = null, IQueryable<OpportunityCategory>? mappings = null,
        IQueryable<OpportunityModel>? opportunities = null, IOpportunityCategoryService? categoryService = null)
      {
        if (source == null)
        {
          var zulu = AddCategory("Zulu");
          var alpha = AddCategory("Alpha");
          var other = AddCategory(Domain.Opportunity.Category.Other.ToString());
          var hidden = AddCategory("Hidden only");
          var inactive = AddCategory("Inactive only");
          var inactiveOrganization = AddCategory("Inactive organisation only");
          AddCategory("Unused");
          Add(Status.Active, -1, null, true, zulu, alpha);
          Add(Status.Active, -2, false, true, zulu);
          Add(Status.Active, 1, false, true, alpha);
          Add(Status.Expired, -3, null, true, other, alpha);
          Add(Status.Active, -1, true, true, zulu, hidden);
          Add(Status.Active, -1, false, false, alpha, inactiveOrganization);
          Add(Status.Inactive, -1, false, true, inactive);
          Add(Status.Deleted, -2, true, true, other);
        }
        else
        {
          Rows.AddRange(source.Rows);
          Categories.AddRange(source.Categories);
        }

        Mappings.Setup(repository => repository.Query()).Returns(() => mappings ?? Rows.AsQueryable());
        Opportunities.Setup(repository => repository.Query(true)).Returns(opportunities ?? Array.Empty<OpportunityModel>().AsQueryable());
        Opportunities.Setup(repository => repository.WhereCustomFields(It.IsAny<IQueryable<OpportunityModel>>(), It.IsAny<List<CustomFieldFilter>?>()))
          .Returns((IQueryable<OpportunityModel> query, List<CustomFieldFilter>? _) => query);
        var categories = new Mock<IOpportunityCategoryService>();
        categories.Setup(service => service.List()).Returns(() => [.. Categories.Select(item =>
          new Category { Id = item.Id, Name = item.Name, ImageURL = item.ImageURL })]);
        var statuses = new Mock<IOpportunityStatusService>();
        statuses.Setup(service => service.GetByName(It.IsAny<string>())).Returns((string name) =>
          new Domain.Opportunity.Models.Lookups.OpportunityStatus { Id = StatusIds[Enum.Parse<Status>(name)], Name = name });
        var organizationStatuses = new Mock<IOrganizationStatusService>();
        organizationStatuses.Setup(service => service.GetByName(OrganizationStatus.Active.ToString())).Returns(
          new Domain.Entity.Models.Lookups.OrganizationStatus { Id = OrganizationActiveId, Name = OrganizationStatus.Active.ToString() });
        Organizations.Setup(service => service.EnsureExist(It.IsAny<List<Guid>>(), true)).Returns(true);
        var organizations = Organizations.Object;
        var types = Mock.Of<IOpportunityTypeService>();
        var difficulty = Mock.Of<IOpportunityDifficultyService>();
        var engagement = Mock.Of<IEngagementTypeService>();
        var intervals = Mock.Of<ITimeIntervalService>();
        var countries = Mock.Of<ICountryService>();
        var languages = Mock.Of<ILanguageService>();
        var skills = Mock.Of<ISkillService>();
        var verificationTypes = Mock.Of<IOpportunityVerificationTypeService>();
        var identityFactory = new Mock<IIdentityProviderClientFactory>();
        identityFactory.Setup(factory => factory.CreateClient()).Returns(Mock.Of<IIdentityProviderClient>());

        Service = new OpportunityService(NullLogger<OpportunityService>.Instance, Options.Create(new AppSettings()), _http,
          statuses.Object, categoryService ?? categories.Object, countries, organizations, organizationStatuses.Object, types, languages, skills,
          difficulty, engagement, verificationTypes, intervals, Mock.Of<IBlobService>(), Mock.Of<IUserService>(),
          Mock.Of<INotificationURLFactory>(), Mock.Of<INotificationDeliveryService>(), identityFactory.Object, Mock.Of<ISyncStateService>(),
          Mock.Of<ITreasuryService>(), Mock.Of<IPartnerService>(), Mock.Of<ICustomFieldDefinitionService>(), Mock.Of<ICustomFieldValueService>(),
          Mock.Of<ISSISchemaService>(),
          new OpportunityRequestValidatorCreate(types, organizations, difficulty, engagement, intervals, categories.Object, countries, languages, skills, verificationTypes),
          new OpportunityRequestValidatorUpdate(types, organizations, difficulty, engagement, intervals, categories.Object, countries, languages, skills, verificationTypes),
          new OpportunitySearchFilterValidator(), new OpportunitySearchFilterCriteriaValidator(organizations), Mock.Of<IMediator>(),
          Opportunities.Object, Mappings.Object, Mock.Of<IRepository<OpportunityCountry>>(), Mock.Of<IRepository<OpportunityLanguage>>(),
          Mock.Of<IRepository<OpportunitySkill>>(), Mock.Of<IRepository<OpportunityVerificationType>>(), Mock.Of<IExecutionStrategyService>());
      }

      internal Category AddCategory(string name)
      {
        var category = new Category { Id = Guid.NewGuid(), Name = name, ImageURL = $"https://example.org/{Guid.NewGuid()}.png" };
        Categories.Add(category);
        return category;
      }

      internal void SetRole(string role)
        => _http.HttpContext!.User = new ClaimsPrincipal(new ClaimsIdentity(
          [new Claim(Constants.ClaimType_Role, role)], "Test", ClaimTypes.Name, Constants.ClaimType_Role));

      internal void Add(Status status, int startDays, bool? hidden, bool activeOrganization, params Category[] categories)
      {
        var opportunityId = Guid.NewGuid();
        var organizationId = Guid.NewGuid();
        foreach (var category in categories)
          Rows.Add(new OpportunityCategory
          {
            Id = Guid.NewGuid(),
            OpportunityId = opportunityId,
            CategoryId = category.Id,
            OrganizationId = organizationId,
            OrganizationStatusId = activeOrganization ? OrganizationActiveId : OrganizationInactiveId,
            OpportunityStatusId = StatusIds[status],
            OpportunityDateStart = DateTimeOffset.UtcNow.AddDays(startDays),
            OpporunityHidden = hidden
          });
      }
    }

    private sealed class CommandRecorder : DbCommandInterceptor
    {
      internal List<string> Commands { get; } = [];

      public override InterceptionResult<DbDataReader> ReaderExecuting(DbCommand command, CommandEventData eventData,
        InterceptionResult<DbDataReader> result)
      {
        Commands.Add(command.CommandText);
        return result;
      }
    }
    #endregion
  }
}
