using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;
using FluentValidation;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.Opportunity.Validators;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.Treasury.Interfaces;
using Category = Yoma.Core.Domain.Opportunity.Models.Lookups.OpportunityCategory;
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

      Assert.Throws<NotSupportedException>(() =>
        fixture.Service.ListOpportunitySearchCriteriaCategories([(PublishedState)999]));
      fixture.Opportunities.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(PublishedState.Active, 2)]
    [InlineData(PublishedState.NotStarted, 2)]
    [InlineData(PublishedState.Expired, 3)]
    public void MasterEndDateTransitionsPreservePublishedStateCounts(PublishedState state, int expectedCount)
    {
      var fixture = new Fixture();
      fixture.Rows.Clear();
      fixture.Categories.Clear();
      var category = fixture.AddCategory("Date-aware category");
      var now = DateTimeOffset.UtcNow;
      fixture.Add(Status.Active, now.AddDays(-1), null, false, true, category);
      fixture.Add(Status.Active, now.AddDays(1), null, false, true, category);
      fixture.Add(Status.Active, now.AddDays(-2), now.AddDays(-1), false, true, category);
      fixture.Add(Status.Active, now.AddDays(1), now.AddDays(-1), false, true, category);
      fixture.Add(Status.Active, now.AddDays(-1), now.AddDays(1), false, true, category);
      fixture.Add(Status.Active, now.AddDays(1), now.AddDays(2), false, true, category);
      fixture.Add(Status.Expired, now.AddDays(-1), now.AddDays(1), false, true, category);
      fixture.Add(Status.Inactive, now.AddDays(-2), now.AddDays(-1), false, true, category);
      fixture.Add(Status.Active, now.AddDays(-2), now.AddDays(-1), true, true, category);
      fixture.Add(Status.Active, now.AddDays(-2), now.AddDays(-1), false, false, category);

      var result = Assert.Single(fixture.Service.ListOpportunitySearchCriteriaCategories([state]));

      Assert.Equal(category.Id, result.Id);
      Assert.Equal(expectedCount, result.Count);
      fixture.Mappings.Verify(repository => repository.Query(), Times.Once);
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
            PublishedState.Active => row.OpportunityStatusId == Fixture.ActiveId && row.OpportunityDateStart <= now &&
              (!row.OpportunityDateEnd.HasValue || row.OpportunityDateEnd >= now),
            PublishedState.NotStarted => row.OpportunityStatusId == Fixture.ActiveId && row.OpportunityDateStart > now &&
              (!row.OpportunityDateEnd.HasValue || row.OpportunityDateEnd >= now),
            PublishedState.Expired => row.OpportunityStatusId == Fixture.ExpiredId ||
              row.OpportunityStatusId == Fixture.ActiveId && row.OpportunityDateEnd < now,
            _ => throw new NotSupportedException($"Published state '{state}' is not supported")
          })).Select(row => row.OpportunityId).Distinct().Count()
      }).Where(item => item.Count > 0)
        .OrderBy(item => item.Category.Name == Domain.Opportunity.Category.Other.ToString())
        .ThenBy(item => item.Category.Name).ToList();

      Assert.Equal(expected.Select(item => (item.Category.Id, item.Category.Name, item.Category.ImageURL, item.Count)),
        actual.Select(item => (item.Id, item.Name, item.ImageURL, item.Count!.Value)));
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
      internal Mock<IRepositoryBatchedValueContainsWithNavigationAndCustomFieldFilterAndTrackingTotals<OpportunityModel>> Opportunities { get; } = new();
      internal OpportunityService Service { get; }

      internal Fixture()
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
        var now = DateTimeOffset.UtcNow;
        Add(Status.Active, now.AddDays(-2), now.AddDays(-1), false, true, zulu);
        Add(Status.Active, now.AddDays(1), now.AddDays(-1), false, true, alpha);
        Add(Status.Active, now.AddDays(-1), now.AddDays(1), false, true, alpha);
        Add(Status.Active, now.AddDays(1), now.AddDays(2), false, true, zulu);
        Add(Status.Expired, now.AddDays(-1), now.AddDays(1), false, true, other);

        Mappings.Setup(repository => repository.Query()).Returns(() => Rows.AsQueryable());
        Opportunities.Setup(repository => repository.Query(true)).Returns(Array.Empty<OpportunityModel>().AsQueryable());
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
        var engagement = Mock.Of<IEngagementTypeService>();
        var intervals = Mock.Of<ITimeIntervalService>();
        var countries = Mock.Of<ICountryService>();
        var languages = Mock.Of<ILanguageService>();
        var skills = Mock.Of<ISkillService>();
        var verificationTypes = Mock.Of<IOpportunityVerificationTypeService>();
        var accessibility = Mock.Of<IAccessibilityService>();
        var targetedGroups = Mock.Of<ITargetedGroupService>();
        var sustainableDevelopmentGoals = Mock.Of<ISustainableDevelopmentGoalService>();
        var currency = Mock.Of<ICurrencyService>();
        var countryValidator = new OpportunityRequestCountryValidator(countries, new CoordinatesValidator());
        var searchValidator = new OpportunitySearchFilterValidator(new OpportunitySearchSelectionValidator(
          new CoordinatesValidator(), countries, accessibility, new CustomFieldFilterValidator()));
        var identityFactory = new Mock<IIdentityProviderClientFactory>();
        identityFactory.Setup(factory => factory.CreateClient()).Returns(Mock.Of<IIdentityProviderClient>());

        Service = new OpportunityService(NullLogger<OpportunityService>.Instance, Options.Create(new AppSettings()), _http,
          statuses.Object, categories.Object, countries, organizations, organizationStatuses.Object, types, languages, skills,
          engagement, verificationTypes, intervals, Mock.Of<IBlobService>(), Mock.Of<IUserService>(),
          Mock.Of<INotificationURLFactory>(), Mock.Of<INotificationDeliveryService>(), identityFactory.Object, Mock.Of<ISyncStateService>(),
          Mock.Of<ITreasuryService>(), Mock.Of<IPartnerService>(), Mock.Of<ICustomFieldDefinitionService>(), Mock.Of<ICustomFieldValueService>(),
          Mock.Of<ISSISchemaService>(),
          Mock.Of<IRepository<OpportunityAccommodation>>(), Mock.Of<IRepository<OpportunityTargetedGroup>>(),
          Mock.Of<IRepository<OpportunitySustainableDevelopmentGoal>>(), accessibility, targetedGroups, sustainableDevelopmentGoals,
          new OpportunityRequestValidatorCreate(types, organizations, engagement, intervals, categories.Object, countries, languages, skills,
            verificationTypes, countryValidator, currency, accessibility, targetedGroups, sustainableDevelopmentGoals),
          new OpportunityRequestValidatorUpdate(types, organizations, engagement, intervals, categories.Object, countries, languages, skills,
            verificationTypes, countryValidator, currency, accessibility, targetedGroups, sustainableDevelopmentGoals),
          countryValidator, searchValidator, new OpportunitySearchFilterCriteriaValidator(organizations), Mock.Of<IMediator>(),
          Opportunities.Object, Mappings.Object, Mock.Of<IRepositoryPropertyContainsWithSpatial<OpportunityCountry>>(), Mock.Of<IRepository<OpportunityLanguage>>(),
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
        => Add(status, DateTimeOffset.UtcNow.AddDays(startDays), null, hidden, activeOrganization, categories);

      internal void Add(Status status, DateTimeOffset start, DateTimeOffset? end, bool? hidden, bool activeOrganization, params Category[] categories)
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
            OpportunityDateStart = start,
            OpportunityDateEnd = end,
            OpporunityHidden = hidden
          });
      }
    }

    #endregion
  }
}
