using Microsoft.EntityFrameworkCore;
using Moq;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Caching.Memory;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Models.Lookups;
using Yoma.Core.Domain.Opportunity.Services.Lookups;
using Yoma.Core.Domain.Core.Extensions;
using Xunit;

namespace Yoma.Core.Test.Core
{
  public class OpportunityTaxonomyTests
  {

    private static readonly (Guid Id, string Name, string Icon)[] ApprovedCategories =
    [
      (new Guid("2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950"), "Agriculture, Food, Environment and Climate", "AgricultureFoodEnvironmentAndClimate.svg"),
      (new Guid("fa564c1c-591a-4a6d-8294-20165da8866b"), "Technology, AI & Data", "TechnologyAIAndData.svg"),
      (new Guid("c76786fd-fca9-4633-85b3-11e53486d708"), "Business, Finance & Marketing", "BusinessFinanceAndMarketing.svg"),
      (new Guid("7afb66ad-164e-46a3-933f-a0bac1ca1923"), "Creative, Media & Design", "CreativeMediaAndDesign.svg"),
      (new Guid("6e6a5f23-6d2e-4f45-8b4d-5d9c9a6b1e71"), "Health, Safety & Wellbeing", "HealthSafetyAndWellbeing.svg"),
      (new Guid("f36051c9-9057-4765-bc2f-9dee82ef60d6"), "Hospitality & Tourism", "HospitalityAndTourism.svg"),
      (new Guid("89f4ab46-0767-494f-a18c-3037f698133a"), "Personal Development & Career Readiness", "PersonalDevelopmentAndCareerReadiness.svg"),
      (new Guid("15ba04a2-5b3d-4d40-aa20-62ea38c9769a"), "Engineering, Science & Mathematics", "EngineeringScienceAndMathematics.svg"),
      (new Guid("45a18936-5965-4ffe-b12e-beeb81a40f34"), "Beauty & Personal Care", "BeautyAndPersonalCare.svg"),
      (new Guid("be1c903e-87bb-41cd-8da4-1f2f286d7dc9"), "Languages & Communication", "LanguagesAndCommunication.svg"),
      (new Guid("1612eb90-806b-40db-bc6e-a428780581dc"), "History, Society & Human Rights", "HistorySocietyAndHumanRights.svg"),
      (new Guid("0529387f-b8fe-4166-ba03-54293370197f"), "Office, Admin & Professional Skills", "OfficeAdminAndProfessionalSkills.svg"),
      (new Guid("1e8e59ae-4009-48ef-8c09-a72d6af068c7"), "Education & Teaching", "EducationAndTeaching.svg"),
      (new Guid("944c4b9a-8dc8-4e18-8913-2a01461a4f9b"), "Law, Governance & Compliance", "LawGovernanceAndCompliance.svg"),
      (new Guid("8a1778eb-0cd3-434c-bfb6-15788fd0b678"), "Retail & Food Services", "RetailAndFoodServices.svg"),
      (new Guid("b89c5e91-9cbb-4a0e-991f-f987eebf9b70"), "Other", "Other.svg")
    ];

    [Theory]
    [InlineData(typeof(Infrastructure.Alison.Client.AlisonClient), "Categories_Map")]
    [InlineData(typeof(Infrastructure.Jobberman.Client.JobbermanClient), "JobbermanCategoryMappings")]
    [InlineData(typeof(Infrastructure.JobJack.Client.JobJackClient), "CategoryMappings")]
    [InlineData(typeof(Infrastructure.IXO.PartnerSync.Client.IXOClient), "CategoryMappings")]
    [InlineData(typeof(Infrastructure.Umuzi.Client.UmuziClient), "CategoryMappings")]
    public void PartnerMappingsTargetApprovedCategoriesWithoutAmbiguousAliases(Type client, string fieldName)
    {
      var mappings = GetPartnerMappings(client, fieldName);
      Assert.NotEmpty(mappings);
      Assert.All(mappings.Keys, id => Assert.Contains(ApprovedCategories, category => category.Id == id));

      // Alison keeps slash-specific overrides; other partners normalize their source labels.
      var normalize = client.GetMethod("NormalizeLookupKey", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
      var aliases = mappings.SelectMany(mapping => mapping.Value.Select(value => new
      {
        Key = normalize == null ? value.Trim() : (string?)normalize.Invoke(null, [value]),
        Id = mapping.Key
      }));
      foreach (var group in aliases.GroupBy(alias => alias.Key, StringComparer.OrdinalIgnoreCase))
        Assert.Single(group.Select(alias => alias.Id).Distinct());
    }

    [Theory]
    [InlineData(typeof(Infrastructure.Alison.Client.AlisonClient), "Categories_Map", "education", "1e8e59ae-4009-48ef-8c09-a72d6af068c7")]
    [InlineData(typeof(Infrastructure.Alison.Client.AlisonClient), "Categories_Map", "education/climate-change", "2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950")]
    [InlineData(typeof(Infrastructure.Alison.Client.AlisonClient), "Categories_Map", "data-science", "fa564c1c-591a-4a6d-8294-20165da8866b")]
    [InlineData(typeof(Infrastructure.Jobberman.Client.JobbermanClient), "JobbermanCategoryMappings", "Legal Services", "944c4b9a-8dc8-4e18-8913-2a01461a4f9b")]
    [InlineData(typeof(Infrastructure.Jobberman.Client.JobbermanClient), "JobbermanCategoryMappings", "Food Services & Catering", "8a1778eb-0cd3-434c-bfb6-15788fd0b678")]
    [InlineData(typeof(Infrastructure.JobJack.Client.JobJackClient), "CategoryMappings", "Restaurant", "8a1778eb-0cd3-434c-bfb6-15788fd0b678")]
    [InlineData(typeof(Infrastructure.IXO.PartnerSync.Client.IXOClient), "CategoryMappings", "Education", "1e8e59ae-4009-48ef-8c09-a72d6af068c7")]
    [InlineData(typeof(Infrastructure.Umuzi.Client.UmuziClient), "CategoryMappings", "Environment and Climate", "2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950")]
    [InlineData(typeof(Infrastructure.Umuzi.Client.UmuziClient), "CategoryMappings", "AI, Data and Analytics", "fa564c1c-591a-4a6d-8294-20165da8866b")]
    public void PartnerVocabularyMapsToFinalTaxonomy(Type client, string fieldName, string source, string expectedId)
    {
      var mapping = Assert.Single(GetPartnerMappings(client, fieldName), mapping => mapping.Value.Contains(source));
      Assert.Equal(Guid.Parse(expectedId), mapping.Key);
    }

    [Theory]
    [InlineData(" EDUCATION ", "1e8e59ae-4009-48ef-8c09-a72d6af068c7")]
    [InlineData("education/climate-change", "2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950")]
    [InlineData("engineering/renewable-energy", "2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950")]
    [InlineData("engineering/new-course", "15ba04a2-5b3d-4d40-aa20-62ea38c9769a")]
    [InlineData("language/new-course", "be1c903e-87bb-41cd-8da4-1f2f286d7dc9")]
    [InlineData("unrecognized-category", null)]
    [InlineData(null, null)]
    public void AlisonPreservesExactOverrideRootFallbackAndUnknownHandling(string? source, string? expectedId)
    {
      var method = typeof(Infrastructure.Alison.Client.AlisonClient).GetMethod("TryResolveYomaCategoryId",
        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
      Assert.NotNull(method);
      object?[] arguments = [source, Guid.Empty];
      var resolved = Assert.IsType<bool>(method.Invoke(null, arguments));
      Assert.Equal(expectedId != null, resolved);
      Assert.Equal(expectedId == null ? Guid.Empty : Guid.Parse(expectedId), arguments[1]);
    }

    private static Dictionary<Guid, string[]> GetPartnerMappings(Type client, string fieldName)
    {
      var field = client.GetField(fieldName, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
      Assert.NotNull(field);
      return Assert.IsType<Dictionary<Guid, string[]>>(field.GetValue(null));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void CategoryLookupAlwaysSortsOtherLast(bool cacheEnabled)
    {
      var repository = new Mock<IRepository<OpportunityCategory>>();
      repository.Setup(value => value.Query()).Returns(new List<OpportunityCategory>
      {
        new() { Name = "Other" },
        new() { Name = "Technology, AI & Data" },
        new() { Name = "Agriculture, Food, Environment and Climate" }
      }.AsQueryable());
      using var cache = new MemoryCache(new MemoryCacheOptions());
      var service = new OpportunityCategoryService(Options.Create(new AppSettings
      {
        CacheEnabledByCacheItemTypes = cacheEnabled ? "Lookups" : "",
        CacheSlidingExpirationInHours = 1,
        CacheAbsoluteExpirationRelativeToNowInDays = 1
      }), cache, repository.Object);

      // Exercise both the initial load and a cache hit (or a second uncached read).
      for (var i = 0; i < 2; i++)
        Assert.Equal(
          ["Agriculture, Food, Environment and Climate", "Technology, AI & Data", "Other"],
          service.List().Select(category => category.Name));
      repository.Verify(value => value.Query(), Times.Exactly(cacheEnabled ? 1 : 2));
    }

    [Fact]
    public void ImpactActionEnumAndLookupUseNameAndDescription()
    {
      var id = Guid.NewGuid();
      var repository = new Mock<IRepository<OpportunityType>>();
      repository.Setup(item => item.Query()).Returns(new List<OpportunityType>
      {
        new() { Id = id, Name = "ImpactAction", DisplayName = "Impact Action" }
      }.AsQueryable());
      var service = new OpportunityTypeService(Options.Create(new AppSettings
      {
        CacheEnabledByCacheItemTypes = ""
      }), Mock.Of<IMemoryCache>(), repository.Object);

      Assert.Equal(id, service.GetByName(Domain.Opportunity.Type.ImpactAction.ToString()).Id);
      Assert.Equal("Impact Action", Domain.Opportunity.Type.ImpactAction.ToDescription());
    }

    [Fact]
    public void IXOImpactActionMapsToRenamedOpportunityType()
    {
      var parse = typeof(Infrastructure.IXO.PartnerSync.Client.IXOClient).GetMethod("ParseOpportunityType",
        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
      Assert.NotNull(parse);
      Assert.Equal(Domain.Opportunity.Type.ImpactAction, parse.Invoke(null, ["Impact Action"]));
    }

  }
}
