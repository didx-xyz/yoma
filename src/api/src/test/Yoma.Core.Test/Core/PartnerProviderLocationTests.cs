using Microsoft.Extensions.Logging;
using Moq;
using System.Reflection;
using System.Runtime.CompilerServices;
using Xunit;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.Alison.Client;
using Yoma.Core.Infrastructure.Alison.Models;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Client;
using Yoma.Core.Infrastructure.Umuzi.Client;

namespace Yoma.Core.Test.Core
{
  public class PartnerProviderLocationTests
  {
    #region Class Variables
    private static readonly Domain.Lookups.Models.Country Specific = new()
    {
      Id = Guid.NewGuid(),
      CodeAlpha2 = "IE",
      CodeAlpha3 = "IRL",
      Name = "Ireland"
    };
    private static readonly Domain.Lookups.Models.Country Other = new()
    {
      Id = Guid.NewGuid(),
      CodeAlpha2 = "ZA",
      CodeAlpha3 = "ZAF",
      Name = "South Africa"
    };
    private static readonly Domain.Lookups.Models.Country Worldwide = new()
    {
      Id = Guid.NewGuid(),
      CodeAlpha2 = "WW",
      Name = "Worldwide"
    };

    private static readonly string[] MixedWorldwideCountryCodes = ["IE", "WW", "ZA"];
    private static readonly string[] SpecificCountryCodesWithDuplicate = ["IE", "ZA", "IE"];
    private static readonly string[] UnsupportedCountryCodes = ["Unrecognized"];
    #endregion Class Variables

    #region Tests
    [Theory]
    [InlineData(0, false)]
    [InlineData(1, false)]
    [InlineData(2, false)]
    [InlineData(1, true)]
    [InlineData(2, true)]
    public void AlisonMapsOnlyFirstSuppliedPublisher(int count, bool missingFields)
    {
      var client = CreateAlisonClient();
      var course = new Course { Id = 123, Name = "Publisher mapping test", Slug = "publisher-mapping-test" };
      if (count > 0)
      {
        course.Publishers.Add(new Publisher
        {
          Name = missingFields ? " " : "<b>First &amp; Publisher</b>",
          ImageUrl = missingFields ? " " : " https://example.com/first.png ",
          Location = missingFields ? "Unrecognized" : "Cork, Ireland",
          CountryId = 999
        });
      }
      if (count > 1)
      {
        course.Publishers.Add(new Publisher
        {
          Name = "Second Publisher",
          ImageUrl = "https://example.com/second.png",
          Location = Other.Name
        });
      }

      var method = typeof(AlisonClient).GetMethod("ToSyncItem", BindingFlags.Instance | BindingFlags.NonPublic,
        null, [typeof(Course), typeof(bool)], null)!;
      var mapped = Assert.IsType<SyncItemEntity<Domain.Opportunity.Models.OpportunityRequestCreate>>(
        method.Invoke(client, [course, false])).Item;
      var hasProvider = count > 0 && !missingFields;

      Assert.Equal(hasProvider ? "First & Publisher" : null, mapped.Provider);
      Assert.Equal(hasProvider ? "https://example.com/first.png" : null, mapped.ProviderLogoURL);
      Assert.Equal(hasProvider ? Specific.Id : (Guid?)null, mapped.ProviderCountryId);
      Assert.Null(mapped.ProviderURL);
      Assert.Equal(Worldwide.Id, Assert.Single(mapped.Countries).CountryId);
      if (hasProvider) Assert.Contains("First & Publisher", mapped.Keywords!);
    }

    [Fact]
    public void AlisonResolvesOnlySelectedPublisherOriginWithoutInventingAvailability()
    {
      var client = (AlisonClient)RuntimeHelpers.GetUninitializedObject(typeof(AlisonClient));
      SetCountries(client);
      var method = typeof(AlisonClient).GetMethod("GetProviderCountry", BindingFlags.Instance | BindingFlags.NonPublic)!;
      Assert.Null(method.Invoke(client, [null]));
      foreach (var location in new[] { " ", "Global", "Worldwide", "Unrecognized" })
        Assert.Null(method.Invoke(client, [new Publisher { Location = location }]));
      Assert.Null(method.Invoke(client, [new Publisher { CountryId = 999 }]));
      foreach (var location in new[] { "Ireland", "Cork, Ireland", "Galway, Ireland" })
        Assert.Same(Specific, method.Invoke(client, [new Publisher { Location = location }]));
      Assert.Same(Other, method.Invoke(client, [new Publisher { Location = Other.Name }]));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void PartnerWorldwideAvailabilityIsExclusiveWithoutTreatingOthersAsProviderOrigins(bool umuzi)
    {
      var type = umuzi ? typeof(UmuziClient) : typeof(IXOClient);
      var client = RuntimeHelpers.GetUninitializedObject(type);
      SetCountries(client);
      var method = type.GetMethod("GetCountries", BindingFlags.Instance | BindingFlags.NonPublic)!;
      var result = Assert.IsType<List<Domain.Lookups.Models.Country>>(method.Invoke(client, [MixedWorldwideCountryCodes]));
      Assert.Same(Worldwide, Assert.Single(result));
      result = Assert.IsType<List<Domain.Lookups.Models.Country>>(method.Invoke(client, [SpecificCountryCodesWithDuplicate]));
      Assert.Equal([Specific.Id, Other.Id], result.Select(country => country.Id));
      var exception = Assert.Throws<TargetInvocationException>(() => method.Invoke(client, [UnsupportedCountryCodes]));
      Assert.IsType<InvalidOperationException>(exception.InnerException);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void IxoMappingUsesOnlyKnownProviderFields(bool unknownFields)
    {
      var client = (IXOClient)RuntimeHelpers.GetUninitializedObject(typeof(IXOClient));
      SetCountries(client);
      SetField(client, "_logger", Mock.Of<ILogger<IXOClient>>());
      SetField(client, "_options", new Infrastructure.IXO.PartnerSync.Models.IXOPartnerSyncOptions
      {
        OrganizationIdYoma = Guid.NewGuid()
      });
      var types = new Mock<IOpportunityTypeService>();
      types.Setup(service => service.GetByName(Domain.Opportunity.Type.Job.ToString()))
        .Returns(new Domain.Opportunity.Models.Lookups.OpportunityType { Id = Guid.NewGuid(), Name = "Job" });
      SetField(client, "_opportunityTypeService", types.Object);
      var categories = new Mock<IOpportunityCategoryService>();
      categories.Setup(service => service.GetByName(Domain.Opportunity.Category.Other.ToString()))
        .Returns(new Domain.Opportunity.Models.Lookups.OpportunityCategory { Id = Guid.NewGuid() });
      SetField(client, "_opportunityCategoryService", categories.Object);
      var languages = new Mock<ILanguageService>();
      languages.Setup(service => service.GetByName(Domain.Core.Language.English.ToString()))
        .Returns(new Domain.Lookups.Models.Language { Id = Guid.NewGuid() });
      SetField(client, "_languageService", languages.Object);

      var payload = new Infrastructure.IXO.PartnerSync.Models.OpportunityResponse
      {
        ExternalId = "ixo-provider-test",
        Type = Domain.Opportunity.Type.Job.ToString(),
        Title = "Provider mapping test",
        URL = "https://example.com/opportunity",
        StartDate = DateTimeOffset.UtcNow,
        Provider = "IXO Provider",
        ProviderLogoURL = "https://studio.ixo.earth/domain-profile-default.png",
        Countries = [Specific.CodeAlpha2!]
      };
      var payloadJson = Newtonsoft.Json.Linq.JObject.FromObject(payload);
      if (unknownFields)
      {
        // Unsupported partner fields are not assumed merely because Yoma has corresponding core fields.
        payloadJson["providerUrl"] = "https://example.com/provider";
        payloadJson["providerCountry"] = "Unrecognized";
      }
      var cacheItem = new Infrastructure.IXO.PartnerSync.Models.Opportunity
      {
        ExternalId = payload.ExternalId,
        PayloadJson = payloadJson.ToString()
      };
      var method = typeof(IXOClient).GetMethod("ToSyncItem", BindingFlags.Instance | BindingFlags.NonPublic,
        null, [typeof(Infrastructure.IXO.PartnerSync.Models.Opportunity)], null)!;
      var mapped = Assert.IsType<SyncItemEntity<Domain.Opportunity.Models.OpportunityRequestCreate>>(
        method.Invoke(client, [cacheItem]));
      Assert.Equal(payload.Provider, mapped.Item.Provider);
      Assert.Null(mapped.Item.ProviderURL);
      Assert.Equal(payload.ProviderLogoURL, mapped.Item.ProviderLogoURL);
      Assert.Null(mapped.Item.ProviderCountryId);
      Assert.Equal(Specific.Id, Assert.Single(mapped.Item.Countries).CountryId);
    }
    #endregion Tests

    #region Private Members
    private static AlisonClient CreateAlisonClient()
    {
      var client = (AlisonClient)RuntimeHelpers.GetUninitializedObject(typeof(AlisonClient));
      SetCountries(client);
      SetField(client, "_logger", Mock.Of<ILogger<AlisonClient>>());
      SetField(client, "_options", new AlisonOptions
      {
        OrganizationIdYoma = Guid.NewGuid(),
        WebBaseUrl = "https://example.com"
      });

      var types = new Mock<IOpportunityTypeService>();
      types.Setup(service => service.GetByName(Domain.Opportunity.Type.Learning.ToString()))
        .Returns(new Domain.Opportunity.Models.Lookups.OpportunityType { Id = Guid.NewGuid(), Name = "Learning" });
      SetField(client, "_opportunityTypeService", types.Object);

      var categories = new Mock<IOpportunityCategoryService>();
      categories.Setup(service => service.GetByName(Domain.Opportunity.Category.Other.ToString()))
        .Returns(new Domain.Opportunity.Models.Lookups.OpportunityCategory { Id = Guid.NewGuid() });
      SetField(client, "_opportunityCategoryService", categories.Object);

      var languages = new Mock<ILanguageService>();
      languages.Setup(service => service.GetByName(Domain.Core.Language.English.ToString()))
        .Returns(new Domain.Lookups.Models.Language { Id = Guid.NewGuid() });
      SetField(client, "_languageService", languages.Object);

      var intervals = new Mock<ITimeIntervalService>();
      intervals.Setup(service => service.GetByName(Domain.Core.TimeIntervalOption.Hour.ToString()))
        .Returns(new Domain.Lookups.Models.TimeInterval { Id = Guid.NewGuid() });
      SetField(client, "_timeIntervalService", intervals.Object);

      var engagementTypes = new Mock<IEngagementTypeService>();
      engagementTypes.Setup(service => service.GetByName(Domain.Core.EngagementTypeOption.Remote.ToString()))
        .Returns(new Domain.Lookups.Models.EngagementType { Id = Guid.NewGuid() });
      SetField(client, "_engagementTypeService", engagementTypes.Object);

      var definitions = new Mock<Domain.Core.Interfaces.ICustomFieldDefinitionService>();
      definitions.Setup(service => service.GetByKey(Domain.Core.CustomFieldEntityType.Opportunity,
          Domain.Opportunity.CustomFieldConstants.Difficulty.Keys.Learning, true, true))
        .Returns(new Domain.Core.Models.CustomFieldDefinition
        {
          Key = Domain.Opportunity.CustomFieldConstants.Difficulty.Keys.Learning,
          DataType = Domain.Core.CustomFieldDataType.Option,
          Options = [new() { Key = Domain.Opportunity.Difficulty.AnyLevel.ToString(), IsActive = true }]
        });
      SetField(client, "_customFieldDefinitionService", definitions.Object);
      return client;
    }

    private static void SetField(object client, string name, object value)
    {
      client.GetType().GetField(name, BindingFlags.Instance | BindingFlags.NonPublic)!
        .SetValue(client, value);
    }

    private static void SetCountries(object client)
    {
      var countries = new Mock<ICountryService>();
      countries.Setup(service => service.List()).Returns([Specific, Other, Worldwide]);
      countries.Setup(service => service.GetByCodeAlpha2(Worldwide.CodeAlpha2!)).Returns(Worldwide);
      countries.Setup(service => service.GetByNameOrNull("Ireland")).Returns(Specific);
      countries.Setup(service => service.GetByNameOrNull("South Africa")).Returns(Other);
      client.GetType().GetField("_countryService", BindingFlags.Instance | BindingFlags.NonPublic)!
        .SetValue(client, countries.Object);
    }
    #endregion Private Members
  }
}
