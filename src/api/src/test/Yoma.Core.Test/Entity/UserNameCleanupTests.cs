using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Models.Lookups;
using Yoma.Core.Domain.Entity.Services;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Payout.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Domain.SSI.Interfaces;

namespace Yoma.Core.Test.Entity
{
  public class UserNameCleanupTests
  {
    #region Public Members
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ProfileCreateAndUpdate_SaveSameCleanedNamesInYomaAndIdentityProvider(bool create)
    {
      var fixture = new Fixture();
      var service = fixture.ProfileService();

      var result = create
        ? await service.Create(new UserRequestCreateProfile
        {
          FirstName = " José<> ",
          Surname = "D’Arcy-\"Smith",
          Email = Fixture.Email,
          CountryCodeAlpha2 = "ZA"
        })
        : await service.Update(new UserRequestUpdateProfile
        {
          FirstName = " José<> ",
          Surname = "D’Arcy-\"Smith",
          Email = Fixture.Email
        });

      Assert.Equal("José", result.FirstName);
      Assert.Equal("D’Arcy-Smith", result.Surname);
      Assert.Equal("José D’Arcy-Smith", result.DisplayName);
      Assert.Equal(result.FirstName, fixture.SavedUser!.FirstName);
      Assert.Equal(result.Surname, fixture.SavedUser.Surname);
      Assert.Equal(result.FirstName, fixture.IdentityRequest!.FirstName);
      Assert.Equal(result.Surname, fixture.IdentityRequest.LastName);
      Assert.Equal(Fixture.Email, fixture.IdentityRequest.Email);
    }

    [Theory]
    [InlineData(false, "<>&", "Smith")]
    [InlineData(true, "<>&", "Smith")]
    [InlineData(false, "Jane", "<>!?")]
    [InlineData(true, "Jane", "<>!?")]
    [InlineData(false, null, "Smith")]
    [InlineData(true, "Jane", null)]
    public async Task ProfileCreateAndUpdate_EmptyCleanedNamesFailBeforeEitherWrite(bool create, string? firstName, string? surname)
    {
      var fixture = new Fixture();
      var service = fixture.ProfileService();

      await Assert.ThrowsAsync<ValidationException>(async () =>
      {
        if (create)
          await service.Create(new UserRequestCreateProfile
          {
            FirstName = firstName!,
            Surname = surname!,
            Email = Fixture.Email,
            CountryCodeAlpha2 = "ZA"
          });
        else
          await service.Update(new UserRequestUpdateProfile
          {
            FirstName = firstName!,
            Surname = surname!,
            Email = Fixture.Email
          });
      });

      Assert.Null(fixture.SavedUser);
      fixture.Identity.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("Jo<hn", "O'Con>nor", "John", "O'Connor")]
    [InlineData(null, null, null, null)]
    [InlineData("<>!", "  ", null, null)]
    public async Task Upsert_CleansImportedNamesAndPreservesOptionalNames(string? firstName, string? surname,
      string? expectedFirstName, string? expectedSurname)
    {
      var fixture = new Fixture();

      var result = await fixture.UserService().Upsert(new UserRequest
      {
        Username = Fixture.Email,
        Email = Fixture.Email,
        FirstName = firstName,
        Surname = surname
      }, false, false);

      Assert.Equal(expectedFirstName, result.FirstName);
      Assert.Equal(expectedSurname, result.Surname);
      Assert.Same(result, fixture.SavedUser);
    }

    [Fact]
    public async Task Upsert_LinkedUserStillPreservesExistingProfile()
    {
      var fixture = new Fixture();
      fixture.Repository.Setup(repository => repository.Query(false)).Returns(new[] { fixture.ExistingUser }.AsQueryable());

      var result = await fixture.UserService().Upsert(new UserRequest
      {
        Id = fixture.ExistingUser.Id,
        ExternalId = fixture.ExistingUser.ExternalId,
        Username = Fixture.Email,
        Email = Fixture.Email,
        FirstName = "Changed<",
        Surname = "Changed>"
      }, false, false);

      Assert.Equal("Existing", result.FirstName);
      Assert.Equal("User", result.Surname);
    }
    #endregion

    #region Private Members
    private sealed class Fixture
    {
      public const string Email = "person@example.com";
      public readonly Mock<IIdentityProviderClient> Identity = new();
      public readonly Mock<IRepositoryValueContainsWithNavigation<User>> Repository = new();
      public readonly User ExistingUser = new()
      {
        Id = Guid.NewGuid(),
        ExternalId = Guid.NewGuid(),
        Username = Email,
        Email = Email,
        FirstName = "Existing",
        Surname = "User",
        YoIDOnboarded = true
      };

      public User? SavedUser;
      public Domain.IdentityProvider.Models.UserRequestBase? IdentityRequest;

      private readonly Mock<ICountryService> _country = new();
      private readonly IEducationService _education = Mock.Of<IEducationService>();
      private readonly IGenderService _gender = Mock.Of<IGenderService>();
      private readonly Mock<ISettingsDefinitionService> _settings = new();
      private readonly Mock<IExecutionStrategyService> _execution = new();

      public Fixture()
      {
        Repository.Setup(repository => repository.Query(false)).Returns(Array.Empty<User>().AsQueryable());
        Repository.Setup(repository => repository.Create(It.IsAny<User>()))
          .Callback<User>(user => SavedUser = user).ReturnsAsync((User user) => user);
        Repository.Setup(repository => repository.Update(It.IsAny<User>()))
          .Callback<User>(user => SavedUser = user).ReturnsAsync((User user) => user);

        Identity.Setup(provider => provider.CreateUser(It.IsAny<Domain.IdentityProvider.Models.UserRequestCreate>()))
          .Callback<Domain.IdentityProvider.Models.UserRequestCreate>(request => IdentityRequest = request)
          .ReturnsAsync(new Domain.IdentityProvider.Models.User { Id = Guid.NewGuid() });
        Identity.Setup(provider => provider.UpdateUser(It.IsAny<Domain.IdentityProvider.Models.UserRequestUpdate>()))
          .Callback<Domain.IdentityProvider.Models.UserRequestUpdate>(request => IdentityRequest = request)
          .Returns(Task.CompletedTask);

        var country = new Domain.Lookups.Models.Country { Id = Guid.NewGuid(), Name = "South Africa" };
        _country.Setup(service => service.GetByCodeAlpha2OrNull("ZA")).Returns(country);
        _country.Setup(service => service.GetByCodeAlpha2("ZA")).Returns(country);
        _country.Setup(service => service.GetById(country.Id)).Returns(country);
        _country.Setup(service => service.GetByCodeAlpha2("WW")).Returns(new Domain.Lookups.Models.Country { Id = Guid.NewGuid() });
        _settings.Setup(service => service.ListByEntityType(EntityType.User)).Returns([
          new SettingsDefinition { Key = "test", Type = SettingType.Boolean, DefaultValue = "false" }
        ]);
        _execution.Setup(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), false))
          .Returns((Func<Task> action, bool _) => action());
      }

      public UserProfileService ProfileService()
      {
        var factory = new Mock<IIdentityProviderClientFactory>();
        factory.Setup(item => item.CreateClient()).Returns(Identity.Object);
        var users = new Mock<IUserService>();
        users.Setup(service => service.GetByUsername(Email, true, true)).Returns(ExistingUser);
        var context = new HttpContextAccessor
        {
          HttpContext = new DefaultHttpContext
          {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, Email)], "test"))
          }
        };
        var wallet = new Mock<IWalletService>();
        wallet.Setup(service => service.GetWalletStatusAndBalance(It.IsAny<Guid>()))
          .ReturnsAsync((default, new WalletBalance()));
        var organizations = new Mock<IOrganizationService>();
        organizations.Setup(service => service.ListAdminsOf(true)).Returns([]);
        var opportunities = new Mock<IMyOpportunityService>();
        opportunities.Setup(service => service.Search(It.IsAny<MyOpportunitySearchFilter>(), It.IsAny<User>()))
          .Returns(new MyOpportunitySearchResults());
        var links = new Mock<ILinkService>();
        links.Setup(service => service.Search(It.IsAny<ReferralLinkSearchFilterAdmin>())).Returns(new ReferralLinkSearchResults());
        var usages = new Mock<ILinkUsageService>();
        usages.Setup(service => service.Search(It.IsAny<ReferralLinkUsageSearchFilterAdmin>())).Returns(new ReferralLinkUsageSearchResults());

        return new UserProfileService(NullLogger<UserProfileService>.Instance, context, factory.Object, users.Object,
          _gender, _country.Object, _education, organizations.Object, opportunities.Object, wallet.Object,
          Mock.Of<IRewardService>(), Mock.Of<IPayoutTransactionService>(), Mock.Of<IPayoutService>(), _settings.Object,
          Mock.Of<IBlockService>(), links.Object, usages.Object,
          new UserRequestCreateProfileValidator(_country.Object, _education, _gender),
          new UserRequestUpdateProfileValidator(_country.Object, _education, _gender), Repository.Object, _execution.Object);
      }

      public UserService UserService()
      {
        return new UserService(Options.Create(new AppSettings()), Mock.Of<IBlobService>(), Mock.Of<ISkillService>(),
          Mock.Of<ISSITenantService>(), Mock.Of<ISSICredentialService>(), _settings.Object, Mock.Of<IDelayedExecutionService>(),
          new UserRequestValidator(_country.Object, _education, _gender), new UserSearchFilterValidator(),
          new SettingsRequestValidator(), Repository.Object, Mock.Of<IRepository<UserSkill>>(),
          Mock.Of<IRepository<UserSkillOrganization>>(), Mock.Of<IRepository<UserLoginHistory>>(),
          _execution.Object, Mock.Of<IMediator>());
      }
    }
    #endregion
  }
}
