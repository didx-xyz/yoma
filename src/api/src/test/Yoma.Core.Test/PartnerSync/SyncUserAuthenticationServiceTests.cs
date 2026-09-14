using FluentValidation;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.PartnerSync;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Services;

namespace Yoma.Core.Test.PartnerSync
{
  public class SyncUserAuthenticationServiceTests
  {
    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("  ", false)]
    [InlineData("partner-user", true)]
    [InlineData(" partner-user ", true)]
    public void IsLinked_IsDerivedAndNotSerialized(string? externalId, bool expected)
    {
      var info = new SyncInfoUserPartner { ExternalId = externalId };

      Assert.Equal(expected, info.IsLinked);
      Assert.DoesNotContain("IsLinked", Newtonsoft.Json.JsonConvert.SerializeObject(info));

      info.ExternalId = expected ? null : "new-link";
      Assert.Equal(!expected, info.IsLinked);
    }

    [Theory]
    [InlineData(SyncPartner.Alison)]
    [InlineData(SyncPartner.IXO)]
    public async Task MissingProfile_ThrowsValidationBeforeCallingProvider(SyncPartner partner)
    {
      var fixture = new Fixture(partner);
      fixture.User.FirstName = " ";
      fixture.User.Surname = null;
      fixture.User.CountryId = null;

      var error = await Assert.ThrowsAsync<ValidationException>(() => fixture.Authenticate());

      Assert.Equal(["FirstName", "Surname", "Country"], error.Errors.Select(o => o.PropertyName));
      fixture.Factory.Verify(o => o.CreateClient<ISyncProviderClientUserAuthentication>(It.IsAny<SyncPartner>()), Times.Never);
      fixture.State.Verify(o => o.UpsertUserSyncInfo(It.IsAny<Guid>(), It.IsAny<SyncInfoUserPartner>()), Times.Never);
    }

    [Theory]
    [InlineData(SyncPartner.Alison)]
    [InlineData(SyncPartner.IXO)]
    public async Task CompleteProfile_Authenticates(SyncPartner partner)
    {
      var fixture = new Fixture(partner);
      var result = await fixture.Authenticate();

      Assert.Equal("https://partner.example/authenticated", result!.URL);
      fixture.Provider.Verify(o => o.Authenticate(It.IsAny<SyncRequestUserAuthentication>()), Times.Once);
    }

    [Theory]
    [InlineData(SyncPartner.Alison)]
    [InlineData(SyncPartner.IXO)]
    public async Task NoEmail_PreservesProviderRedirectBehaviour(SyncPartner partner)
    {
      var fixture = new Fixture(partner);
      fixture.User.Email = null;
      fixture.User.FirstName = null;
      fixture.User.Surname = null;
      fixture.User.CountryId = null;

      await fixture.Authenticate();

      fixture.Provider.Verify(o => o.Authenticate(It.IsAny<SyncRequestUserAuthentication>()), Times.Once);
    }

    [Fact]
    public async Task LinkedAlisonUser_DoesNotRequireRegistrationProfile()
    {
      var fixture = new Fixture(SyncPartner.Alison);
      fixture.User.FirstName = null;
      fixture.User.Surname = null;
      fixture.User.CountryId = null;
      fixture.State.Setup(o => o.GetUserSyncInfo(fixture.User.Id)).Returns(new SyncInfoUser
      {
        Partners = [new SyncInfoUserPartner { Partner = SyncPartner.Alison, ExternalId = "existing-user" }]
      });

      await fixture.Authenticate();

      fixture.Provider.Verify(o => o.Authenticate(It.IsAny<SyncRequestUserAuthentication>()), Times.Once);
    }

    [Fact]
    public async Task UnknownCountry_RequiresProfileCorrection()
    {
      var fixture = new Fixture(SyncPartner.IXO);
      fixture.User.CountryId = Guid.NewGuid();

      var error = await Assert.ThrowsAsync<ValidationException>(() => fixture.Authenticate());

      Assert.Equal("Country", Assert.Single(error.Errors).PropertyName);
    }

    [Fact]
    public async Task PartnerWithoutAuthentication_PreservesDefaultUrl()
    {
      var fixture = new Fixture(SyncPartner.JobJack, false);
      fixture.User.FirstName = null;

      var result = await fixture.Authenticate();

      Assert.Equal("https://partner.example/opportunity", result!.URL);
      fixture.Factory.Verify(o => o.CreateClient<ISyncProviderClientUserAuthentication>(It.IsAny<SyncPartner>()), Times.Never);
    }

    [Fact]
    public async Task ProviderOutage_PreservesBestEffortFallback()
    {
      var fixture = new Fixture(SyncPartner.Alison);
      fixture.Provider.Setup(o => o.Authenticate(It.IsAny<SyncRequestUserAuthentication>()))
        .ThrowsAsync(new HttpRequestException("Partner unavailable"));

      var result = await fixture.Authenticate();

      Assert.Equal("https://partner.example/opportunity", result!.URL);
    }

    private sealed class Fixture
    {
      public readonly Mock<ISyncStateService> State = new();
      public readonly Mock<ISyncProviderClientFactoryResolver> Factory = new();
      public readonly Mock<ISyncProviderClientUserAuthentication> Provider = new();
      public readonly Domain.Entity.Models.User User;
      private readonly SyncUserAuthenticationService _service;
      private readonly SyncInfoEntity _syncInfo;

      public Fixture(SyncPartner partner, bool authenticationEnabled = true)
      {
        var countryId = Guid.NewGuid();
        User = new Domain.Entity.Models.User
        {
          Id = Guid.NewGuid(),
          Username = "user@example.com",
          Email = "user@example.com",
          FirstName = "Test",
          Surname = "User",
          CountryId = countryId
        };
        var countries = new Mock<ICountryService>();
        countries.Setup(o => o.GetByIdOrNull(countryId)).Returns(new Domain.Lookups.Models.Country
        {
          Id = countryId,
          Name = "South Africa",
          CodeAlpha2 = "ZA"
        });
        var partners = new Mock<IPartnerService>();
        partners.Setup(o => o.GetByName(partner.ToString())).Returns(new Domain.PartnerSync.Models.Lookups.Partner
        {
          Name = partner.ToString(),
          SyncCapabilitiesParsed = new()
          {
            [SyncType.Pull] = new()
            {
              [EntityType.Opportunity] = authenticationEnabled ? [SyncScope.UserAuthentication] : []
            }
          }
        });
        Factory.Setup(o => o.CreateClient<ISyncProviderClientUserAuthentication>(partner)).Returns(Provider.Object);
        Provider.Setup(o => o.Authenticate(It.IsAny<SyncRequestUserAuthentication>()))
          .ReturnsAsync(new SyncResultUserAuthentication { URL = "https://partner.example/authenticated" });
        _service = new SyncUserAuthenticationService(NullLogger<SyncUserAuthenticationService>.Instance,
          State.Object, countries.Object, partners.Object, Factory.Object);
        _syncInfo = new SyncInfoEntity
        {
          SyncType = SyncType.Pull,
          Partners = [new SyncInfoEntityPartner
          {
            Partner = partner, EntityType = EntityType.Opportunity, ExternalId = "opportunity-1",
            URL = "https://partner.example/opportunity"
          }]
        };
      }

      public Task<SyncInfoEntityPartner?> Authenticate() => _service.Authenticate(User, _syncInfo);
    }
  }
}
