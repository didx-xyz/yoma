using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json.Linq;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Validators;
using Yoma.Core.Infrastructure.Umuzi.Client;
using Yoma.Core.Infrastructure.Umuzi.Interfaces;
using Yoma.Core.Infrastructure.Umuzi.Models;
using CachedOpportunity = Yoma.Core.Infrastructure.Umuzi.Models.Opportunity;

namespace Yoma.Core.Test.PartnerSync
{
  public class UmuziOpportunityVisibilityTests
  {
    #region Class Variables
    // Partner-supplied October 14 payload, with hidden varied by each test.
    private const string Payload = """
      {
        "id": "a2dd5529-635c-48a9-9284-f2718d4f0d8a",
        "externalId": "b847d172-8f4b-4ed5-b7a1-f4e6c8f96a31",
        "umuziType": "component",
        "yomaType": "Learning",
        "title": "Full Stack Development",
        "url": "https://yoma-partner-ui-juwf.onrender.com/opportunities/b847d172-8f4b-4ed5-b7a1-f4e6c8f96a31",
        "description": "Build practical skills in front-end and back-end web development through guided learning and hands-on projects.",
        "summary": "Learn to build full-stack web applications.",
        "categories": ["Technology and Digitization"],
        "countries": ["ZA"],
        "languages": ["en"],
        "skills": ["JavaScript", "HTML", "CSS", "Web Development", "Problem Solving"],
        "keywords": ["full stack", "web development", "JavaScript"],
        "startDate": "2026-10-14T10:55:00Z",
        "endDate": null,
        "commitmentInterval": "Week",
        "commitmentCount": 12,
        "difficulty": "Beginner",
        "engagementType": "Online",
        "active": true,
        "createdAt": "2026-10-14T10:55:00Z",
        "updatedAt": "2026-10-14T10:55:00Z"
      }
      """;
    #endregion Class Variables

    #region Tests
    [Theory]
    [InlineData("Learning", true)]
    [InlineData("Learning", false)]
    [InlineData("Learning", null)]
    [InlineData("Job", true)]
    [InlineData("Job", false)]
    [InlineData("Job", null)]
    public async Task CatalogueMappingHonoursInitialVisibilityAndDefaultsOmittedFlag(string type, bool? hidden)
    {
      var request = await Map(type, hidden);

      Assert.Equal(hidden ?? false, request.Hidden);
      Assert.True(request.PostAsActive);
      Assert.Equal("Full Stack Development", request.Title);
      Assert.True(request.CredentialIssuanceEnabled);
    }

    [Theory]
    [InlineData("Learning")]
    [InlineData("Job")]
    public async Task PullUpdateOmitsHiddenAndItsHashIgnoresFeedVisibilityChanges(string type)
    {
      var hidden = await Map(type, true);
      var visible = await Map(type, false);
      var omitted = await Map(type, null);
      var id = Guid.NewGuid();

      var hiddenUpdate = hidden.ToRequestUpdate(id, applyHidden: false);
      var visibleUpdate = visible.ToRequestUpdate(id, applyHidden: false);
      var omittedUpdate = omitted.ToRequestUpdate(id, applyHidden: false);

      Assert.Null(hiddenUpdate.Hidden);
      Assert.Null(visibleUpdate.Hidden);
      Assert.Null(omittedUpdate.Hidden);
      var hash = HashHelper.ComputeSHA256Hash(hiddenUpdate);
      Assert.Equal(hash, HashHelper.ComputeSHA256Hash(visibleUpdate));
      Assert.Equal(hash, HashHelper.ComputeSHA256Hash(omittedUpdate));

      // Other provider changes must still trigger normal pull updates.
      visibleUpdate.Title = "Updated programme title";
      Assert.NotEqual(hash, HashHelper.ComputeSHA256Hash(visibleUpdate));
    }
    #endregion Tests

    #region Private Members
    private static async Task<OpportunityRequestCreate> Map(string type, bool? hidden)
    {
      var json = JObject.Parse(Payload);
      json["yomaType"] = type;
      if (hidden.HasValue) json["hidden"] = hidden.Value;

      var response = json.ToObject<OpportunityResponse>()!;
      // The catalogue persists the DTO as JSON before the domain pull reads it.
      var cache = new CachedOpportunity
      {
        ExternalId = response.ExternalId,
        PayloadJson = HashHelper.SerializeForHashing(response),
        Deleted = false
      };
      Assert.Equal(hidden ?? false, JObject.Parse(cache.PayloadJson).Value<bool>("hidden"));
      var repository = new Mock<IRepositoryBatched<CachedOpportunity>>();
      repository.Setup(service => service.Query()).Returns(new[] { cache }.AsQueryable());

      var types = new Mock<IOpportunityTypeService>();
      types.Setup(service => service.GetByName(type))
        .Returns(new Domain.Opportunity.Models.Lookups.OpportunityType { Id = Guid.Parse("7a99ebd9-4690-48c8-b9db-9d9357325544"), Name = type });
      var categories = new Mock<IOpportunityCategoryService>();
      categories.Setup(service => service.GetById(It.IsAny<Guid>()))
        .Returns((Guid id) => new Domain.Opportunity.Models.Lookups.OpportunityCategory { Id = id });
      var countries = new Mock<ICountryService>();
      countries.Setup(service => service.List()).Returns([new() { Id = Guid.Parse("3e9e6597-938b-49ba-b217-ebcc6f33808a"), CodeAlpha2 = "ZA" }]);
      var languages = new Mock<ILanguageService>();
      languages.Setup(service => service.GetByCodeAlpha2OrNull("en"))
        .Returns(new Domain.Lookups.Models.Language { Id = Guid.Parse("75714f89-369d-4af0-9833-896489fb7213") });
      var difficulty = new Mock<IOpportunityDifficultyService>();
      difficulty.Setup(service => service.GetByNameOrNull("Beginner"))
        .Returns(new Domain.Opportunity.Models.Lookups.OpportunityDifficulty());
      var intervals = new Mock<ITimeIntervalService>();
      intervals.Setup(service => service.GetByNameOrNull("Week")).Returns(new Domain.Lookups.Models.TimeInterval());
      var engagement = new Mock<IEngagementTypeService>();
      engagement.Setup(service => service.GetByNameOrNull("Online")).Returns(new Domain.Lookups.Models.EngagementType());

      var client = new UmuziClient(
        Mock.Of<ILogger<UmuziClient>>(),
        Mock.Of<IEnvironmentProvider>(),
        Options.Create(new AppSettings()),
        Options.Create(new UmuziOptions { OrganizationIdYoma = Guid.Parse("90c1c22e-d734-493b-aa0a-339f63d4ad20") }),
        repository.Object,
        types.Object,
        categories.Object,
        countries.Object,
        languages.Object,
        Mock.Of<ISkillService>(),
        difficulty.Object,
        intervals.Object,
        engagement.Object,
        Mock.Of<IUmuziAuthService>(),
        new SyncFilterPullEntityValidator(),
        new SyncFilterPullVerificationValidator());

      var result = await client.List(new SyncFilterPullEntity { PageNumber = 1, PageSize = 10 });
      return Assert.Single(result.Items).Item;
    }
    #endregion Private Members
  }
}
