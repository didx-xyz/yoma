using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.Opportunity.Validators;
using Yoma.Core.Domain.PartnerSync;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.Treasury.Interfaces;
using OpportunityModel = Yoma.Core.Domain.Opportunity.Models.Opportunity;

namespace Yoma.Core.Test.OpportunitySearch
{
  public class OpportunitySyncSearchTests
  {
    #region Tests
    [Theory]
    [InlineData(1, true)]
    [InlineData(2, true)]
    [InlineData(3, true)]
    [InlineData(1, false)]
    public void SearchBatchesOnlyReturnedItemsAndPreservesComputedValues(int page, bool separateHydration)
    {
      var fixture = new Fixture();
      var expected = fixture.Items.OrderByDescending(item => item.DateCreated).Skip((page - 1) * 12).Take(12).ToList();

      var result = fixture.Service.Search(new OpportunitySearchFilterAdmin { PageNumber = page, PageSize = 12 }, false, separateHydration);

      Assert.Equal(fixture.Items.Count, result.TotalCount);
      Assert.Equal(expected.Select(item => item.Id), result.Items!.Select(item => item.Id));
      fixture.Sync.Verify(service => service.GetSyncInfo(EntityType.Opportunity,
        It.Is<IReadOnlyDictionary<Guid, string?>>(urls => urls.Count == expected.Count && expected.All(item => urls.ContainsKey(item.Id) && urls[item.Id] == item.URL))), Times.Once);
      fixture.Sync.Verify(service => service.GetSyncInfo(It.IsAny<EntityType>(), It.IsAny<Guid>(), It.IsAny<string?>()), Times.Never);
      foreach (var item in result.Items!)
      {
        Assert.True(item.Published);
        Assert.Equal($"https://example.org/logo/{item.OrganizationLogoKey}", item.OrganizationLogoURL);
        Assert.Same(fixture.Info[item.Id], item.SyncedInfo);
      }
    }

    [Fact]
    public void EmptyPageDoesNotFetchSyncInformation()
    {
      var fixture = new Fixture();

      var result = fixture.Service.Search(new OpportunitySearchFilterAdmin { PageNumber = 4, PageSize = 12 }, false);

      Assert.Empty(result.Items!);
      fixture.Sync.VerifyNoOtherCalls();
    }

    [Fact]
    public void CountOnlySearchDoesNotFetchSyncInformation()
    {
      var fixture = new Fixture();
      var filter = new OpportunitySearchFilterAdmin();
      typeof(OpportunitySearchFilterBase).GetProperty("TotalCountOnly", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(filter, true);

      Assert.Equal(fixture.Items.Count, fixture.Service.Search(filter, false).TotalCount);
      fixture.Sync.VerifyNoOtherCalls();
    }

    [Fact]
    public void SingleItemReadsRetainTheSingleSyncLookup()
    {
      var fixture = new Fixture();
      var item = fixture.Items[0];
      fixture.Repository.Setup(repository => repository.Query(false)).Returns(fixture.Items.AsQueryable());
      fixture.Sync.Setup(service => service.GetSyncInfo(EntityType.Opportunity, item.Id, item.URL)).Returns(fixture.Info[item.Id]);

      Assert.Same(item, fixture.Service.GetById(item.Id, false, true, false));
      fixture.Sync.Verify(service => service.GetSyncInfo(EntityType.Opportunity, item.Id, item.URL), Times.Once);
      fixture.Sync.Verify(service => service.GetSyncInfo(It.IsAny<EntityType>(), It.IsAny<IReadOnlyDictionary<Guid, string?>>()), Times.Never);
    }

    [Fact]
    public void BatchValidationFailureStillFailsTheSearch()
    {
      var fixture = new Fixture();
      var error = new DataInconsistencyException("Mixed synchronization types");
      fixture.Sync.Setup(service => service.GetSyncInfo(EntityType.Opportunity, It.IsAny<IReadOnlyDictionary<Guid, string?>>())).Throws(error);

      Assert.Same(error, Assert.Throws<DataInconsistencyException>(() =>
        fixture.Service.Search(new OpportunitySearchFilterAdmin { PageNumber = 1, PageSize = 12 }, false)));
    }
    #endregion

    #region Fixture
    private sealed class Fixture
    {
      internal List<OpportunityModel> Items { get; } = [];
      internal Dictionary<Guid, SyncInfoEntity?> Info { get; } = [];
      internal Mock<ISyncStateService> Sync { get; } = new();
      internal Mock<IRepositoryBatchedValueContainsWithNavigationAndCustomFieldFilter<OpportunityModel>> Repository { get; } = new();
      internal OpportunityService Service { get; }

      internal Fixture()
      {
        for (var index = 0; index < 25; index++)
        {
          var item = new OpportunityModel
          {
            Id = Guid.NewGuid(),
            Title = $"Opportunity {index}",
            Status = Domain.Opportunity.Status.Active,
            OrganizationStatus = Domain.Entity.OrganizationStatus.Active,
            OrganizationLogoStorageType = StorageType.Public,
            OrganizationLogoKey = $"logo-{index}",
            URL = index % 2 == 0 ? null : $"https://example.org/{index}",
            DateCreated = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero).AddMinutes(index)
          };
          Items.Add(item);
          Info.Add(item.Id, index % 3 == 0 ? null : new SyncInfoEntity
          {
            SyncType = index % 3 == 1 ? SyncType.Push : SyncType.Pull,
            Partners = [new SyncInfoEntityPartner { Partner = SyncPartner.Jobberman, EntityType = EntityType.Opportunity, ExternalId = $"external-{index}", URL = item.URL }]
          });
        }
        Repository.Setup(repository => repository.Query(true)).Returns(Items.AsQueryable());
        Repository.Setup(repository => repository.WhereCustomFields(It.IsAny<IQueryable<OpportunityModel>>(), It.IsAny<List<CustomFieldFilter>?>()))
          .Returns((IQueryable<OpportunityModel> query, List<CustomFieldFilter>? _) => query);
        Sync.Setup(service => service.GetSyncInfo(EntityType.Opportunity, It.IsAny<IReadOnlyDictionary<Guid, string?>>()))
          .Returns((EntityType _, IReadOnlyDictionary<Guid, string?> urls) => urls.ToDictionary(item => item.Key, item => Info[item.Key]));
        var blobs = new Mock<IBlobService>();
        blobs.Setup(service => service.GetURL(It.IsAny<StorageType>(), It.IsAny<string>(), null, null))
          .Returns((StorageType _, string key, string? _, int? _) => $"https://example.org/logo/{key}");
        var organizations = Mock.Of<IOrganizationService>();
        var types = Mock.Of<IOpportunityTypeService>();
        var difficulty = Mock.Of<IOpportunityDifficultyService>();
        var engagement = Mock.Of<IEngagementTypeService>();
        var intervals = Mock.Of<ITimeIntervalService>();
        var categories = Mock.Of<IOpportunityCategoryService>();
        var countries = Mock.Of<ICountryService>();
        var languages = Mock.Of<ILanguageService>();
        var skills = Mock.Of<ISkillService>();
        var verificationTypes = Mock.Of<IOpportunityVerificationTypeService>();
        var identityFactory = new Mock<IIdentityProviderClientFactory>();
        identityFactory.Setup(factory => factory.CreateClient()).Returns(Mock.Of<IIdentityProviderClient>());

        Service = new OpportunityService(NullLogger<OpportunityService>.Instance, Options.Create(new AppSettings()), new HttpContextAccessor(),
          Mock.Of<IOpportunityStatusService>(), categories, countries, organizations, Mock.Of<IOrganizationStatusService>(), types, languages, skills,
          difficulty, engagement, verificationTypes, intervals, blobs.Object, Mock.Of<IUserService>(),
          Mock.Of<INotificationURLFactory>(), Mock.Of<INotificationDeliveryService>(), identityFactory.Object, Sync.Object,
          Mock.Of<ITreasuryService>(), Mock.Of<IPartnerService>(), Mock.Of<ICustomFieldDefinitionService>(), Mock.Of<ICustomFieldValueService>(),
          Mock.Of<ISSISchemaService>(),
          new OpportunityRequestValidatorCreate(types, organizations, difficulty, engagement, intervals, categories, countries, languages, skills, verificationTypes),
          new OpportunityRequestValidatorUpdate(types, organizations, difficulty, engagement, intervals, categories, countries, languages, skills, verificationTypes),
          new OpportunitySearchFilterValidator(), new OpportunitySearchFilterCriteriaValidator(organizations), Mock.Of<IMediator>(),
          Repository.Object, Mock.Of<IRepository<OpportunityCategory>>(), Mock.Of<IRepository<OpportunityCountry>>(), Mock.Of<IRepository<OpportunityLanguage>>(),
          Mock.Of<IRepository<OpportunitySkill>>(), Mock.Of<IRepository<OpportunityVerificationType>>(), Mock.Of<IExecutionStrategyService>());
      }
    }
    #endregion
  }
}
