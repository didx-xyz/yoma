using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Services;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces;
using OpportunityModel = Yoma.Core.Domain.Opportunity.Models.Opportunity;

namespace Yoma.Core.Test.Completion
{
  public class CompletionSkillTests
  {
    #region Tests
    [Fact]
    public async Task CompletionCreatesEachSkillAndOrganizationLinkOnlyOnce()
    {
      var fixture = new Fixture();

      await fixture.Service.AssignSkills(fixture.User, fixture.Opportunity);
      await fixture.Service.AssignSkills(fixture.User, fixture.Opportunity);

      Assert.Equal(2, fixture.Skills.Count);
      Assert.Equal(2, fixture.Organizations.Count);
      Assert.All(fixture.Skills, skill => Assert.Equal(fixture.User.Id, skill.UserId));
      Assert.All(fixture.Skills, skill => Assert.Equal(UserSkillType.Verified, skill.Type));
      Assert.All(fixture.Organizations, link =>
      {
        Assert.Equal(fixture.Opportunity.OrganizationId, link.OrganizationId);
        Assert.Contains(fixture.Skills, skill => skill.Id == link.UserSkillId);
      });
    }

    [Fact]
    public async Task ExistingSkillAddsOnlyMissingOrganizationAndPreservesOtherSkills()
    {
      var fixture = new Fixture();
      var existing = new UserSkill { Id = Guid.NewGuid(), UserId = fixture.User.Id, SkillId = fixture.Opportunity.Skills![0].Id };
      var unrelated = new UserSkill { Id = Guid.NewGuid(), UserId = fixture.User.Id, SkillId = Guid.NewGuid() };
      fixture.Skills.AddRange([existing, unrelated]);
      var otherOrganization = new UserSkillOrganization { Id = Guid.NewGuid(), UserSkillId = existing.Id, OrganizationId = Guid.NewGuid() };
      fixture.Organizations.Add(otherOrganization);

      await fixture.Service.AssignSkills(fixture.User, fixture.Opportunity);

      Assert.Equal(3, fixture.Skills.Count);
      Assert.Contains(existing, fixture.Skills);
      Assert.Contains(unrelated, fixture.Skills);
      Assert.Equal(UserSkillType.Verified, existing.Type);
      Assert.Equal(UserSkillType.SelfAttested, unrelated.Type);
      Assert.Equal(3, fixture.Organizations.Count);
      Assert.Contains(otherOrganization, fixture.Organizations);
      Assert.Single(fixture.Organizations, link => link.UserSkillId == existing.Id && link.OrganizationId == fixture.Opportunity.OrganizationId);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task NoConfiguredSkillsMakesNoChanges(bool emptyList)
    {
      var fixture = new Fixture();
      fixture.Opportunity.Skills = emptyList ? [] : null;

      await fixture.Service.AssignSkills(fixture.User, fixture.Opportunity);

      Assert.Empty(fixture.Skills);
      Assert.Empty(fixture.Organizations);
    }

    [Fact]
    public async Task JobCompletionDoesNotAwardSkills()
    {
      var fixture = new Fixture();
      fixture.Opportunity.Type = Yoma.Core.Domain.Opportunity.Type.Job;

      await fixture.Service.AssignSkills(fixture.User, fixture.Opportunity);

      Assert.Empty(fixture.Skills);
      Assert.Empty(fixture.Organizations);
    }
    #endregion

    #region Fixture
    private sealed class Fixture
    {
      internal User User { get; } = new() { Id = Guid.NewGuid() };
      internal OpportunityModel Opportunity { get; } = new()
      {
        Id = Guid.NewGuid(),
        OrganizationId = Guid.NewGuid(),
        Type = Yoma.Core.Domain.Opportunity.Type.Learning,
        Skills = [new() { Id = Guid.NewGuid(), Name = "Communication" }, new() { Id = Guid.NewGuid(), Name = "Teamwork" }]
      };
      internal List<UserSkill> Skills { get; } = [];
      internal List<UserSkillOrganization> Organizations { get; } = [];
      internal UserService Service { get; }

      internal Fixture()
      {
        var skills = new Mock<IRepository<UserSkill>>();
        skills.Setup(repository => repository.Query()).Returns(() => Skills.AsQueryable());
        skills.Setup(repository => repository.Update(It.IsAny<UserSkill>())).ReturnsAsync((UserSkill item) => item);
        skills.Setup(repository => repository.Create(It.IsAny<UserSkill>())).ReturnsAsync((UserSkill item) =>
        {
          item.Id = Guid.NewGuid();
          Skills.Add(item);
          return item;
        });
        var organizations = new Mock<IRepository<UserSkillOrganization>>();
        organizations.Setup(repository => repository.Query()).Returns(() => Organizations.AsQueryable());
        organizations.Setup(repository => repository.Create(It.IsAny<UserSkillOrganization>())).ReturnsAsync((UserSkillOrganization item) =>
        {
          item.Id = Guid.NewGuid();
          Organizations.Add(item);
          return item;
        });
        var lookup = new Mock<ISkillService>();
        lookup.Setup(service => service.GetById(It.IsAny<Guid>())).Returns((Guid id) => new Skill { Id = id });
        var execution = new Mock<IExecutionStrategyService>();
        execution.Setup(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), It.IsAny<bool>()))
          .Returns((Func<Task> body, bool _) => body());

        Service = new UserService(Options.Create(new AppSettings()), Mock.Of<IHttpContextAccessor>(), Mock.Of<IBlobService>(), lookup.Object,
          Mock.Of<IOpportunityCategoryService>(), Mock.Of<IAccessibilityService>(), Mock.Of<ILanguageService>(), Mock.Of<IEngagementTypeService>(),
          Mock.Of<ISSITenantService>(), Mock.Of<ISSICredentialService>(), Mock.Of<ISettingsDefinitionService>(), Mock.Of<IDelayedExecutionService>(),
          new UserRequestValidator(Mock.Of<ICountryService>(), Mock.Of<IEducationService>(), Mock.Of<IGenderService>(), new CoordinatesValidator()),
          new UserSearchFilterValidator(), new SettingsRequestValidator(), Mock.Of<IRepositoryValueContainsWithNavigation<User>>(),
          skills.Object, organizations.Object, Mock.Of<IRepository<UserPreferenceCategory>>(), Mock.Of<IRepository<UserPreferenceAccessibilityRequirement>>(),
          Mock.Of<IRepository<UserPreferenceLanguage>>(), Mock.Of<IRepository<UserPreferenceEngagementType>>(),
          Mock.Of<IRepository<UserLoginHistory>>(), execution.Object, Mock.Of<IMediator>());
      }
    }
    #endregion
  }
}
