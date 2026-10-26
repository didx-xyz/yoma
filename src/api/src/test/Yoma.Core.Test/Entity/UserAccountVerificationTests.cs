using MediatR;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Xunit;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Models.Lookups;
using Yoma.Core.Domain.Entity.Services;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces;

namespace Yoma.Core.Test.Entity
{
  public class UserAccountVerificationTests
  {
    #region Tests
    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    [InlineData(6)]
    [InlineData(7)]
    public void ComputedUserReadResolvesAllFlagCombinationsAndExposesThemOnTheProfile(int flags)
    {
      var user = new User
      {
        Id = Guid.NewGuid(),
        Email = "youth@example.invalid",
        EmailConfirmed = (flags & 1) != 0,
        PhoneNumber = "+27123456789",
        PhoneNumberConfirmed = (flags & 2) != 0
      };
      var history = new List<UserLoginHistory>();
      if ((flags & 4) != 0)
        history.Add(new UserLoginHistory { UserId = user.Id, IdentityProvider = "GOOGLE" });
      var fixture = new Fixture([user], history);

      var result = fixture.Service.GetById(user.Id, false, true);

      Assert.Equal((AccountVerificationMethod)flags, result.AccountVerificationMethods);
      Assert.Equal(result.AccountVerificationMethods, result.ToProfile().AccountVerificationMethods);
      Assert.Contains(nameof(User.AccountVerificationMethods), JsonConvert.SerializeObject(result));
      var serialized = JsonConvert.SerializeObject(result, new StringEnumConverter());
      Assert.Equal(result.AccountVerificationMethods.ToString(),
        Newtonsoft.Json.Linq.JObject.Parse(serialized).Value<string>(nameof(User.AccountVerificationMethods)));
      fixture.Users.Verify(repository => repository.Query(false), Times.Once);
      fixture.History.Verify(repository => repository.Query(), Times.Once);
    }

    [Theory]
    [InlineData("Email")]
    [InlineData("Phone")]
    [InlineData("ExternalId")]
    [InlineData("Username")]
    public void AllComputedLookupPathsUseTheSameSocialProviderRules(string lookup)
    {
      var user = new User
      {
        Id = Guid.NewGuid(),
        ExternalId = Guid.NewGuid(),
        Email = "youth@example.invalid",
        PhoneNumber = "+27123456789"
      };
      var fixture = new Fixture([user],
        [new UserLoginHistory { UserId = user.Id, IdentityProvider = "facebook" }]);

      var result = lookup switch
      {
        "Email" => fixture.Service.GetByEmailOrNull(user.Email, false, true),
        "Phone" => fixture.Service.GetByPhoneOrNull(user.PhoneNumber, false, true),
        "ExternalId" => fixture.Service.GetByExternalIdOrNull(user.ExternalId!.Value, false, true),
        "Username" => fixture.Service.GetByUsername(user.Email, false, true),
        _ => throw new NotSupportedException($"Lookup '{lookup}' is not supported")
      };

      Assert.NotNull(result);
      Assert.Equal(AccountVerificationMethod.SocialLogin, result.AccountVerificationMethods);
      Assert.True(fixture.Service.HasSocialIdentityProviders(user.Id));
    }

    [Fact]
    public void ContainsResolvesSocialHistoryOnceAndDoesNotTreatUnknownProvidersAsSocialLogin()
    {
      var first = new User { Id = Guid.NewGuid(), Email = "first@example.invalid", EmailConfirmed = true };
      var second = new User { Id = Guid.NewGuid(), Email = "second@example.invalid" };
      var fixture = new Fixture([first, second],
      [
        new UserLoginHistory { UserId = first.Id, IdentityProvider = "google" },
        new UserLoginHistory { UserId = first.Id, IdentityProvider = "facebook" },
        new UserLoginHistory { UserId = second.Id, IdentityProvider = "local" }
      ]);

      var results = fixture.Service.Contains("example", false, true);

      Assert.Equal(AccountVerificationMethod.EmailVerified | AccountVerificationMethod.SocialLogin,
        Assert.Single(results, user => user.Id == first.Id).AccountVerificationMethods);
      Assert.Equal(AccountVerificationMethod.None,
        Assert.Single(results, user => user.Id == second.Id).AccountVerificationMethods);
      fixture.History.Verify(repository => repository.Query(), Times.Once);
    }

    [Fact]
    public void NonComputedAndMissingUserReadsDoNotQuerySocialHistory()
    {
      var user = new User { Id = Guid.NewGuid() };
      var fixture = new Fixture([user], []);

      Assert.Equal(AccountVerificationMethod.None, fixture.Service.GetById(user.Id, false, false).AccountVerificationMethods);
      Assert.Null(fixture.Service.GetByIdOrNull(Guid.NewGuid(), false, true));
      fixture.History.Verify(repository => repository.Query(), Times.Never);
    }

    [Fact]
    public void UnknownFlagBitsCannotBeSilentlySigned()
    {
      var value = (AccountVerificationMethod)8;

      Assert.False(value.IsDefinedOrValidFlags());
      Assert.Throws<NotSupportedException>(() => value.GetFlags());
      Assert.Throws<InvalidOperationException>(() => value.ToDescription());
    }
    #endregion Tests

    #region Private Members
    private sealed class Fixture
    {
      public Mock<IRepositoryValueContainsWithNavigation<User>> Users { get; } = new();
      public Mock<IRepository<UserLoginHistory>> History { get; } = new();
      public UserService Service { get; }

      public Fixture(List<User> users, List<UserLoginHistory> history)
      {
        Users.Setup(repository => repository.Query(It.IsAny<bool>())).Returns(() => users.AsQueryable());
        Users.Setup(repository => repository.Contains(It.IsAny<IQueryable<User>>(), It.IsAny<string>()))
          .Returns((IQueryable<User> query, string _) => query);
        History.Setup(repository => repository.Query()).Returns(() => history.AsQueryable());
        var settings = new Mock<ISettingsDefinitionService>();
        settings.Setup(service => service.ListByEntityType(EntityType.User))
          .Returns([new SettingsDefinition { Key = "Test", Type = SettingType.Boolean, DefaultValue = "false" }]);

        Service = new UserService(
          Options.Create(new AppSettings()), Mock.Of<IBlobService>(), Mock.Of<ISkillService>(),
          Mock.Of<IOpportunityCategoryService>(), Mock.Of<IAccessibilityService>(), Mock.Of<ILanguageService>(),
          Mock.Of<IEngagementTypeService>(), Mock.Of<ISSITenantService>(), Mock.Of<ISSICredentialService>(),
          settings.Object, Mock.Of<IDelayedExecutionService>(),
          new UserRequestValidator(Mock.Of<ICountryService>(), Mock.Of<IEducationService>(), Mock.Of<IGenderService>(),
            new Domain.Core.Validators.CoordinatesValidator()),
          new UserSearchFilterValidator(), new SettingsRequestValidator(), Users.Object,
          Mock.Of<IRepository<UserSkill>>(), Mock.Of<IRepository<UserSkillOrganization>>(),
          Mock.Of<IRepository<UserPreferenceCategory>>(), Mock.Of<IRepository<UserPreferenceAccessibilityRequirement>>(),
          Mock.Of<IRepository<UserPreferenceLanguage>>(), Mock.Of<IRepository<UserPreferenceEngagementType>>(),
          History.Object, Mock.Of<IExecutionStrategyService>(), Mock.Of<IMediator>());
      }
    }
    #endregion Private Members
  }
}
