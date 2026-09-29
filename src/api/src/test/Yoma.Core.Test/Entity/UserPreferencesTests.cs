using CsvHelper.Configuration.Attributes;
using CsvWriter = CsvHelper.CsvWriter;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Converters;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Services;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Lookups.Services;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Test.Entity
{
  public class UserPreferencesTests
  {
    [Fact]
    public void OpportunityCategoriesAreIncludedInPreferences()
    {
      var categoryId = Guid.NewGuid();
      var preferences = new UserPreferences
      {
        Categories = [new OpportunityCategory { Id = categoryId, Name = "Technology, AI & Data", ImageURL = "icon.svg" }]
      };

      Assert.Equal(categoryId, Assert.Single(preferences.Categories).Id);
    }

    [Fact]
    public void AccessibilityRequirementsAndOtherDescriptionAreIncludedInPreferences()
    {
      var accessibilityId = Guid.NewGuid();
      var preferences = new UserPreferences
      {
        AccessibilityRequirements = [new Accessibility { Id = accessibilityId, Name = "Other" }],
        AccessibilityRequirementOtherDescription = "Large-print material"
      };

      Assert.Equal(accessibilityId, Assert.Single(preferences.AccessibilityRequirements).Id);
      Assert.Equal("Large-print material", preferences.AccessibilityRequirementOtherDescription);
    }

    [Fact]
    public void AccessibilityRequirementsRequireKnownIdsAndOtherRequiresDescription()
    {
      var otherId = Guid.NewGuid();
      var parkingId = Guid.NewGuid();
      var accommodations = new Mock<IAccessibilityService>();
      accommodations.Setup(o => o.GetByIdOrNull(otherId))
        .Returns(new Accessibility { Id = otherId, Name = "Other" });
      accommodations.Setup(o => o.GetByIdOrNull(parkingId))
        .Returns(new Accessibility { Id = parkingId, Name = "Accessible Parking" });
      var validator = new UserPreferencesRequestValidator(Mock.Of<ISkillService>(), Mock.Of<IOpportunityCategoryService>(),
        Mock.Of<IUserGoalService>(), Mock.Of<ITimeIntervalService>(), accommodations.Object, Mock.Of<IEngagementTypeService>(), Mock.Of<ILanguageService>());

      Assert.True(validator.Validate(new UserPreferencesRequest { AccessibilityRequirements = [parkingId] }).IsValid);
      Assert.True(validator.Validate(new UserPreferencesRequest
      { AccessibilityRequirements = [otherId], AccessibilityRequirementOtherDescription = "Large-print material" }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { AccessibilityRequirements = [otherId] }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest
      { AccessibilityRequirements = [parkingId], AccessibilityRequirementOtherDescription = "Large-print material" }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { AccessibilityRequirements = [Guid.NewGuid()] }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { AccessibilityRequirements = [Guid.Empty] }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest
      { AccessibilityRequirements = [otherId], AccessibilityRequirementOtherDescription = new string('x', 501) }).IsValid);
    }

    [Fact]
    public void GoalIsIncludedInPreferences()
    {
      var goalId = Guid.NewGuid();
      var preferences = new UserPreferences { GoalId = goalId, Goal = "Attend events" };

      Assert.Equal(goalId, preferences.GoalId);
      Assert.Equal("Attend events", preferences.Goal);
      Assert.Null(new UserPreferences().Goal);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    [InlineData(null)]
    public void IncentivePreferencePreservesAllThreeChoices(bool? incentivized)
    {
      var preferences = new UserPreferences { Incentivized = incentivized };

      Assert.Equal(incentivized, preferences.Incentivized);
      Assert.Equal(incentivized, new UserPreferencesRequest
      {
        Incentivized = incentivized
      }.Incentivized);
    }

    [Fact]
    public void EngagementTypeIsSingleSelectAndUsesTheSharedLookup()
    {
      var id = Guid.NewGuid();
      var lookup = new Mock<IEngagementTypeService>();
      lookup.Setup(o => o.GetByIdOrNull(id)).Returns(new EngagementType
      {
        Id = id,
        Name = "OnSite",
        DisplayName = "On-site"
      });
      var validator = new UserPreferencesRequestValidator(Mock.Of<ISkillService>(), Mock.Of<IOpportunityCategoryService>(),
        Mock.Of<IUserGoalService>(), Mock.Of<ITimeIntervalService>(), Mock.Of<IAccessibilityService>(), lookup.Object, Mock.Of<ILanguageService>());

      Assert.True(validator.Validate(new UserPreferencesRequest { EngagementTypeId = id }).IsValid);
      Assert.True(validator.Validate(new UserPreferencesRequest()).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { EngagementTypeId = Guid.NewGuid() }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { EngagementTypeId = Guid.Empty }).IsValid);

      var preferences = new UserPreferences
      {
        EngagementTypeId = id,
        EngagementType = Domain.Core.EngagementTypeOption.OnSite
      };
      Assert.Equal(id, preferences.EngagementTypeId);
      Assert.Equal(Domain.Core.EngagementTypeOption.OnSite, preferences.EngagementType);
      Assert.Equal(Domain.Core.EngagementTypeOption.OnSite, Enum.Parse<Domain.Core.EngagementTypeOption>("OnSite"));
      Assert.Equal("On-site", Domain.Core.EngagementTypeOption.OnSite.ToDescription());
      Assert.Equal("\"OnSite\"", Newtonsoft.Json.JsonConvert.SerializeObject(
        Domain.Core.EngagementTypeOption.OnSite, new StrictStringEnumConverter()));
      Assert.Equal("OnSite", Domain.Core.EngagementTypeOption.OnSite.ToString());
    }

    [Fact]
    public void EngagementLookupAcceptsCanonicalNamesOnly()
    {
      var remoteId = Guid.NewGuid();
      var onSiteId = Guid.NewGuid();
      var repository = new Mock<IRepository<EngagementType>>();
      repository.Setup(o => o.Query()).Returns(new List<EngagementType>
      {
        new() { Id = remoteId, Name = "Remote", DisplayName = "Remote" },
        new() { Id = onSiteId, Name = "OnSite", DisplayName = "On-site" }
      }.AsQueryable());
      var service = new EngagementTypeService(Options.Create(new AppSettings
      {
        CacheEnabledByCacheItemTypes = ""
      }), new MemoryCache(new MemoryCacheOptions()), repository.Object);

      Assert.Equal(remoteId, service.GetByName("Remote").Id);
      Assert.Equal(onSiteId, service.GetByName("OnSite").Id);
      Assert.Null(service.GetByNameOrNull("Online"));
      Assert.Null(service.GetByNameOrNull("Offline"));
      Assert.Null(service.GetByNameOrNull("On-site"));
    }

    [Fact]
    public void EngagementCsvExportUsesTheCanonicalImportName()
    {
      var property = typeof(Domain.Opportunity.Models.OpportunityInfo)
        .GetProperty(nameof(Domain.Opportunity.Models.OpportunityInfo.EngagementType))!;
      Assert.Empty(property.GetCustomAttributes(typeof(TypeConverterAttribute), false));

      using var writer = new StringWriter();
      using var csv = new CsvWriter(writer, System.Globalization.CultureInfo.InvariantCulture);
      csv.WriteField(Domain.Core.EngagementTypeOption.OnSite);
      csv.NextRecord();

      Assert.Equal("OnSite", writer.ToString().TrimEnd('\r', '\n'));
    }

    [Fact]
    public void PreferencesAreNotSerializedOnAdminUserModel()
    {
      var json = Newtonsoft.Json.JsonConvert.SerializeObject(new User());

      Assert.DoesNotContain("GoalId", json);
      Assert.DoesNotContain("Categories", json);
      Assert.Null(typeof(UserProfile).GetProperty("UserPreferences"));
    }

    [Fact]
    public void GoalSelectionRequiresKnownLookupId()
    {
      var knownId = Guid.NewGuid();
      var goals = new Mock<IUserGoalService>();
      goals.Setup(o => o.GetByIdOrNull(knownId)).Returns(new Domain.Entity.Models.Lookups.UserGoal
      {
        Id = knownId,
        Name = "Get a job"
      });
      var validator = new UserPreferencesRequestValidator(Mock.Of<ISkillService>(),
        Mock.Of<IOpportunityCategoryService>(), goals.Object, Mock.Of<ITimeIntervalService>(), Mock.Of<IAccessibilityService>(), Mock.Of<IEngagementTypeService>(), Mock.Of<ILanguageService>());

      Assert.True(validator.Validate(new UserPreferencesRequest { GoalId = knownId }).IsValid);
      Assert.True(validator.Validate(new UserPreferencesRequest { GoalId = null }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { GoalId = Guid.NewGuid() }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { GoalId = Guid.Empty }).IsValid);
    }

    [Fact]
    public void PreferredLanguagesRequireKnownLookupIds()
    {
      var knownId = Guid.NewGuid();
      var languages = new Mock<ILanguageService>();
      languages.Setup(item => item.GetByIdOrNull(knownId))
        .Returns(new Language { Id = knownId, Name = "English", CodeAlpha2 = "en" });
      var validator = new UserPreferencesRequestValidator(Mock.Of<ISkillService>(),
        Mock.Of<IOpportunityCategoryService>(), Mock.Of<IUserGoalService>(), Mock.Of<ITimeIntervalService>(),
        Mock.Of<IAccessibilityService>(), Mock.Of<IEngagementTypeService>(), languages.Object);

      Assert.True(validator.Validate(new UserPreferencesRequest { Languages = [knownId] }).IsValid);
      Assert.True(validator.Validate(new UserPreferencesRequest { Languages = [] }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { Languages = [Guid.Empty] }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { Languages = [Guid.NewGuid()] }).IsValid);
    }

    [Fact]
    public async Task PreferredLanguagesReplaceSelectionAndDeduplicateInput()
    {
      var userId = Guid.NewGuid();
      var retainedId = Guid.NewGuid();
      var removedId = Guid.NewGuid();
      var addedId = Guid.NewGuid();
      var rows = new List<UserPreferenceLanguage>
      {
        new() { Id = Guid.NewGuid(), UserId = userId, LanguageId = retainedId },
        new() { Id = Guid.NewGuid(), UserId = userId, LanguageId = removedId }
      };
      var lookup = new Mock<ILanguageService>();
      lookup.Setup(item => item.GetById(It.IsAny<Guid>()))
        .Returns<Guid>(id => new Language { Id = id, Name = id.ToString(), CodeAlpha2 = "en" });
      var (service, _, _, _) = CreateService([], languageRows: rows, languageLookup: lookup);
      var user = new User { Id = userId };

      await service.RemovePreferenceLanguages(user, [removedId]);
      await service.AssignPreferenceLanguages(user, [retainedId, addedId, addedId]);

      Assert.Equal(2, rows.Count);
      Assert.Equal([retainedId, addedId], rows.Select(item => item.LanguageId));
    }

    [Fact]
    public void CommitmentRequiresKnownIntervalAndPositiveCountTogether()
    {
      var intervalId = Guid.NewGuid();
      var intervals = new Mock<ITimeIntervalService>();
      intervals.Setup(o => o.GetByIdOrNull(intervalId))
        .Returns(new TimeInterval { Id = intervalId, Name = "Hour" });
      var validator = new UserPreferencesRequestValidator(Mock.Of<ISkillService>(),
        Mock.Of<IOpportunityCategoryService>(), Mock.Of<IUserGoalService>(), intervals.Object, Mock.Of<IAccessibilityService>(), Mock.Of<IEngagementTypeService>(), Mock.Of<ILanguageService>());

      Assert.True(validator.Validate(new UserPreferencesRequest()).IsValid);
      Assert.True(validator.Validate(new UserPreferencesRequest
      { CommitmentIntervalId = intervalId, CommitmentIntervalCount = 4 }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { CommitmentIntervalId = intervalId }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { CommitmentIntervalCount = 4 }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest
      { CommitmentIntervalId = intervalId, CommitmentIntervalCount = 0 }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest
      { CommitmentIntervalId = Guid.NewGuid(), CommitmentIntervalCount = 4 }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest
      { CommitmentIntervalId = Guid.Empty, CommitmentIntervalCount = 4 }).IsValid);
    }

    [Fact]
    public void CommitmentIsReturnedWithTheSameShapeAsOpportunity()
    {
      var intervalId = Guid.NewGuid();
      var preferences = new UserPreferences
      {
        CommitmentIntervalId = intervalId,
        CommitmentInterval = Yoma.Core.Domain.Core.TimeIntervalOption.Week,
        CommitmentIntervalCount = 2
      };

      Assert.Equal(intervalId, preferences.CommitmentIntervalId);
      Assert.Equal(Yoma.Core.Domain.Core.TimeIntervalOption.Week, preferences.CommitmentInterval);
      Assert.Equal((short)2, preferences.CommitmentIntervalCount);
    }

    [Fact]
    public async Task OpportunityCategoriesReplaceSelectionAndDeduplicateInput()
    {
      var userId = Guid.NewGuid();
      var retainedId = Guid.NewGuid();
      var removedId = Guid.NewGuid();
      var addedId = Guid.NewGuid();
      var rows = new List<UserPreferenceCategory>
      {
        new() { Id = Guid.NewGuid(), UserId = userId, CategoryId = retainedId },
        new() { Id = Guid.NewGuid(), UserId = userId, CategoryId = removedId }
      };
      var categories = new Mock<IOpportunityCategoryService>();
      categories.Setup(o => o.GetById(It.IsAny<Guid>()))
        .Returns<Guid>(id => new OpportunityCategory { Id = id, Name = id.ToString(), ImageURL = "icon.svg" });
      var (service, _, _, _) = CreateService([], rows, categories);
      var user = new User { Id = userId };

      await service.RemovePreferenceCategories(user, [removedId]);
      await service.AssignPreferenceCategories(user, [retainedId, addedId, addedId]);

      Assert.Equal(2, rows.Count);
      Assert.Contains(rows, o => o.CategoryId == retainedId);
      Assert.Contains(rows, o => o.CategoryId == addedId);
      Assert.DoesNotContain(rows, o => o.CategoryId == removedId);
    }

    [Fact]
    public async Task AccessibilityRequirementsReplaceSelectionAndDeduplicateInput()
    {
      var userId = Guid.NewGuid();
      var retainedId = Guid.NewGuid();
      var removedId = Guid.NewGuid();
      var addedId = Guid.NewGuid();
      var rows = new List<UserPreferenceAccessibilityRequirement>
      {
        new() { Id = Guid.NewGuid(), UserId = userId, AccessibilityId = retainedId },
        new() { Id = Guid.NewGuid(), UserId = userId, AccessibilityId = removedId }
      };
      var accommodations = new Mock<IAccessibilityService>();
      accommodations.Setup(o => o.GetById(It.IsAny<Guid>()))
        .Returns<Guid>(id => new Accessibility { Id = id, Name = id.ToString() });
      var (service, _, _, _) = CreateService([], accommodationRows: rows, accommodationLookup: accommodations);
      var user = new User { Id = userId };

      await service.RemoveAccessibilityRequirements(user, [removedId]);
      await service.AssignAccessibilityRequirements(user, [retainedId, addedId, addedId]);

      Assert.Equal(2, rows.Count);
      Assert.Contains(rows, o => o.AccessibilityId == retainedId);
      Assert.Contains(rows, o => o.AccessibilityId == addedId);
      Assert.DoesNotContain(rows, o => o.AccessibilityId == removedId);
    }

    [Fact]
    public void OpportunityCategorySelectionRequiresKnownLookupIds()
    {
      var knownId = Guid.NewGuid();
      var categories = new Mock<IOpportunityCategoryService>();
      categories.Setup(o => o.GetByIdOrNull(knownId))
        .Returns(new OpportunityCategory { Id = knownId, Name = "Technology, AI & Data", ImageURL = "icon.svg" });
      var validator = new UserPreferencesRequestValidator(Mock.Of<ISkillService>(), categories.Object,
        Mock.Of<IUserGoalService>(), Mock.Of<ITimeIntervalService>(), Mock.Of<IAccessibilityService>(), Mock.Of<IEngagementTypeService>(), Mock.Of<ILanguageService>());

      Assert.True(validator.Validate(new UserPreferencesRequest { Categories = [knownId] }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { Categories = [Guid.NewGuid()] }).IsValid);
      Assert.False(validator.Validate(new UserPreferencesRequest { Categories = [Guid.Empty] }).IsValid);
      Assert.True(validator.Validate(new UserPreferencesRequest { Categories = null }).IsValid);
    }

    [Fact]
    public async Task RemoveThenAssignReplacesOnlySelfAttestedSkillsAndDeduplicatesInput()
    {
      var userId = Guid.NewGuid();
      var retainedId = Guid.NewGuid();
      var removedId = Guid.NewGuid();
      var addedId = Guid.NewGuid();
      var verifiedId = Guid.NewGuid();
      var rows = new List<UserSkill>
      {
        new() { Id = Guid.NewGuid(), UserId = userId, SkillId = retainedId, Type = UserSkillType.SelfAttested },
        new() { Id = Guid.NewGuid(), UserId = userId, SkillId = removedId, Type = UserSkillType.SelfAttested },
        new() { Id = Guid.NewGuid(), UserId = userId, SkillId = verifiedId, Type = UserSkillType.Verified }
      };
      var (service, skills, _, lookup) = CreateService(rows);
      lookup.Setup(o => o.GetById(It.IsAny<Guid>())).Returns<Guid>(id => new Skill { Id = id, Name = id.ToString() });

      var user = new User { Id = userId };
      await service.RemoveSkillsSelfAttested(user, [removedId]);
      await service.AssignSkillsSelfAttested(user, [retainedId, addedId, addedId]);

      Assert.Equal(3, rows.Count);
      Assert.Contains(rows, o => o.SkillId == retainedId && o.Type == UserSkillType.SelfAttested);
      Assert.Contains(rows, o => o.SkillId == addedId && o.Type == UserSkillType.SelfAttested);
      Assert.Contains(rows, o => o.SkillId == verifiedId && o.Type == UserSkillType.Verified);
      Assert.DoesNotContain(rows, o => o.SkillId == removedId);
      skills.Verify(o => o.Create(It.IsAny<UserSkill>()), Times.Once);
    }

    [Fact]
    public async Task VerifiedSkillCannotBeAddedAsSelfAttested()
    {
      var userId = Guid.NewGuid();
      var skillId = Guid.NewGuid();
      var rows = new List<UserSkill> { new() { UserId = userId, SkillId = skillId, Type = UserSkillType.Verified } };
      var (service, skills, _, lookup) = CreateService(rows);
      lookup.Setup(o => o.GetById(skillId)).Returns(new Skill { Id = skillId, Name = "Verified" });

      await Assert.ThrowsAsync<ValidationException>(() => service.AssignSkillsSelfAttested(new User { Id = userId }, [skillId]));

      Assert.Single(rows);
      skills.Verify(o => o.Create(It.IsAny<UserSkill>()), Times.Never);
      skills.Verify(o => o.Delete(It.IsAny<UserSkill>()), Times.Never);
    }

    [Fact]
    public async Task EmptySelectionClearsOnlySelfAttestedSkills()
    {
      var userId = Guid.NewGuid();
      var rows = new List<UserSkill>
      {
        new() { Id = Guid.NewGuid(), UserId = userId, SkillId = Guid.NewGuid(), Type = UserSkillType.SelfAttested },
        new() { Id = Guid.NewGuid(), UserId = userId, SkillId = Guid.NewGuid(), Type = UserSkillType.Verified }
      };
      var (service, _, _, lookup) = CreateService(rows);
      lookup.Setup(o => o.GetById(It.IsAny<Guid>())).Returns<Guid>(id => new Skill { Id = id, Name = id.ToString() });

      await service.RemoveSkillsSelfAttested(new User { Id = userId }, [.. rows.Select(o => o.SkillId)]);

      Assert.Equal(UserSkillType.Verified, Assert.Single(rows).Type);
    }

    [Fact]
    public async Task CompletionPromotesSameSkillAndAddsAwardingOrganization()
    {
      var userId = Guid.NewGuid();
      var skillId = Guid.NewGuid();
      var organizationId = Guid.NewGuid();
      var row = new UserSkill { Id = Guid.NewGuid(), UserId = userId, SkillId = skillId, Type = UserSkillType.SelfAttested };
      var (service, skills, organizations, lookup) = CreateService([row]);
      lookup.Setup(o => o.GetById(skillId)).Returns(new Skill { Id = skillId, Name = "Communication" });

      await service.AssignSkills(new User { Id = userId }, new Domain.Opportunity.Models.Opportunity
      {
        OrganizationId = organizationId,
        Skills = [new Skill { Id = skillId, Name = "Communication" }]
      });

      Assert.Equal(UserSkillType.Verified, row.Type);
      skills.Verify(o => o.Update(row), Times.Once);
      skills.Verify(o => o.Create(It.IsAny<UserSkill>()), Times.Never);
      organizations.Verify(o => o.Create(It.Is<UserSkillOrganization>(x =>
        x.UserSkillId == row.Id && x.OrganizationId == organizationId)), Times.Once);

      var secondOrganizationId = Guid.NewGuid();
      await service.AssignSkills(new User { Id = userId }, new Domain.Opportunity.Models.Opportunity
      {
        OrganizationId = secondOrganizationId,
        Skills = [new Skill { Id = skillId, Name = "Communication" }]
      });
      Assert.Equal(UserSkillType.Verified, row.Type);
      organizations.Verify(o => o.Create(It.Is<UserSkillOrganization>(x =>
        x.UserSkillId == row.Id && x.OrganizationId == secondOrganizationId)), Times.Once);
      skills.Verify(o => o.Create(It.IsAny<UserSkill>()), Times.Never);
    }

    [Fact]
    public async Task CompletingJobDoesNotAwardItsRequiredSkills()
    {
      var userId = Guid.NewGuid();
      var skillId = Guid.NewGuid();
      var row = new UserSkill { Id = Guid.NewGuid(), UserId = userId, SkillId = skillId, Type = UserSkillType.SelfAttested };
      var (service, skills, organizations, lookup) = CreateService([row]);

      await service.AssignSkills(new User { Id = userId }, new Domain.Opportunity.Models.Opportunity
      {
        Type = Domain.Opportunity.Type.Job,
        OrganizationId = Guid.NewGuid(),
        Skills = [new Skill { Id = skillId, Name = "Communication" }]
      });

      Assert.Equal(UserSkillType.SelfAttested, row.Type);
      skills.Verify(o => o.Create(It.IsAny<UserSkill>()), Times.Never);
      skills.Verify(o => o.Update(It.IsAny<UserSkill>()), Times.Never);
      organizations.Verify(o => o.Create(It.IsAny<UserSkillOrganization>()), Times.Never);
      lookup.Verify(o => o.GetById(It.IsAny<Guid>()), Times.Never);
    }

    private static (UserService Service, Mock<IRepository<UserSkill>> Skills,
      Mock<IRepository<UserSkillOrganization>> Organizations, Mock<ISkillService> Lookup) CreateService(
        List<UserSkill> rows, List<UserPreferenceCategory>? categoryRows = null,
        Mock<IOpportunityCategoryService>? categoryLookup = null,
        List<UserPreferenceAccessibilityRequirement>? accommodationRows = null,
        Mock<IAccessibilityService>? accommodationLookup = null,
        List<UserPreferenceLanguage>? languageRows = null,
        Mock<ILanguageService>? languageLookup = null)
    {
      categoryRows ??= [];
      categoryLookup ??= new Mock<IOpportunityCategoryService>();
      accommodationRows ??= [];
      accommodationLookup ??= new Mock<IAccessibilityService>();
      languageRows ??= [];
      languageLookup ??= new Mock<ILanguageService>();
      var skills = new Mock<IRepository<UserSkill>>();
      skills.Setup(o => o.Query()).Returns(() => rows.AsQueryable());
      skills.Setup(o => o.Create(It.IsAny<UserSkill>())).ReturnsAsync((UserSkill item) =>
      {
        item.Id = Guid.NewGuid();
        rows.Add(item);
        return item;
      });
      skills.Setup(o => o.Delete(It.IsAny<UserSkill>())).Returns((UserSkill item) =>
      {
        rows.Remove(item);
        return Task.CompletedTask;
      });
      skills.Setup(o => o.Update(It.IsAny<UserSkill>())).ReturnsAsync((UserSkill item) => item);
      var organizations = new Mock<IRepository<UserSkillOrganization>>();
      organizations.Setup(o => o.Query()).Returns(new List<UserSkillOrganization>().AsQueryable());
      organizations.Setup(o => o.Create(It.IsAny<UserSkillOrganization>())).ReturnsAsync((UserSkillOrganization item) => item);
      var lookup = new Mock<ISkillService>();
      var preferredCategories = new Mock<IRepository<UserPreferenceCategory>>();
      preferredCategories.Setup(o => o.Query()).Returns(() => categoryRows.AsQueryable());
      preferredCategories.Setup(o => o.Create(It.IsAny<UserPreferenceCategory>()))
        .ReturnsAsync((UserPreferenceCategory item) =>
        {
          item.Id = Guid.NewGuid();
          categoryRows.Add(item);
          return item;
        });
      preferredCategories.Setup(o => o.Delete(It.IsAny<UserPreferenceCategory>()))
        .Returns((UserPreferenceCategory item) =>
        {
          categoryRows.Remove(item);
          return Task.CompletedTask;
        });
      var accessibilityRequirements = new Mock<IRepository<UserPreferenceAccessibilityRequirement>>();
      accessibilityRequirements.Setup(o => o.Query()).Returns(() => accommodationRows.AsQueryable());
      accessibilityRequirements.Setup(o => o.Create(It.IsAny<UserPreferenceAccessibilityRequirement>()))
        .ReturnsAsync((UserPreferenceAccessibilityRequirement item) =>
        {
          item.Id = Guid.NewGuid();
          accommodationRows.Add(item);
          return item;
        });
      accessibilityRequirements.Setup(o => o.Delete(It.IsAny<UserPreferenceAccessibilityRequirement>()))
        .Returns((UserPreferenceAccessibilityRequirement item) =>
        {
          accommodationRows.Remove(item);
          return Task.CompletedTask;
        });
      var preferredLanguages = new Mock<IRepository<UserPreferenceLanguage>>();
      preferredLanguages.Setup(item => item.Query()).Returns(() => languageRows.AsQueryable());
      preferredLanguages.Setup(item => item.Create(It.IsAny<UserPreferenceLanguage>()))
        .ReturnsAsync((UserPreferenceLanguage item) =>
        {
          item.Id = Guid.NewGuid();
          languageRows.Add(item);
          return item;
        });
      preferredLanguages.Setup(item => item.Delete(It.IsAny<UserPreferenceLanguage>()))
        .Returns((UserPreferenceLanguage item) =>
        {
          languageRows.Remove(item);
          return Task.CompletedTask;
        });
      var strategy = new Mock<IExecutionStrategyService>();
      strategy.Setup(o => o.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), It.IsAny<bool>()))
        .Returns<Func<Task>, bool>(async (action, _) => await action());

      var service = new UserService(Options.Create(new AppSettings()), Mock.Of<IBlobService>(), lookup.Object,
        categoryLookup.Object, accommodationLookup.Object, languageLookup.Object,
        Mock.Of<Domain.SSI.Interfaces.ISSITenantService>(), Mock.Of<Domain.SSI.Interfaces.ISSICredentialService>(),
        Mock.Of<ISettingsDefinitionService>(), Mock.Of<IDelayedExecutionService>(),
        new UserRequestValidator(Mock.Of<ICountryService>(), Mock.Of<IEducationService>(), Mock.Of<IGenderService>(), new Domain.Core.Validators.CoordinatesValidator()),
        new UserSearchFilterValidator(), new SettingsRequestValidator(),
        Mock.Of<IRepositoryValueContainsWithNavigation<User>>(), skills.Object, organizations.Object,
        preferredCategories.Object, accessibilityRequirements.Object, preferredLanguages.Object,
        Mock.Of<IRepository<UserLoginHistory>>(), strategy.Object, Mock.Of<IMediator>());
      return (service, skills, organizations, lookup);
    }
  }
}
