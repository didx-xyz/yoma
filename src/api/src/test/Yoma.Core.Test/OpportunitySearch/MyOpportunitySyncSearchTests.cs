using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Services;
using Yoma.Core.Domain.MyOpportunity.Validators;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;
using ParticipationAction = Yoma.Core.Domain.MyOpportunity.Action;
using Participation = Yoma.Core.Domain.MyOpportunity.Models.MyOpportunity;

namespace Yoma.Core.Test.OpportunitySearch
{
  public class MyOpportunitySyncSearchTests
  {
    #region Tests
    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    public void VerificationSearchBatchesOnlyReturnedRowsAndPreservesComputedFields(int page)
    {
      var fixture = new Fixture();
      var expected = fixture.Items.OrderBy(item => item.DateModified).Skip((page - 1) * 12).Take(12).ToList();

      var result = fixture.Service.Search(fixture.Filter(page), false);

      Assert.Equal(25, result.TotalCount);
      Assert.Equal(expected.Select(item => item.Id), result.Items!.Select(item => item.Id));
      fixture.Sync.Verify(service => service.GetSyncInfoMyOpportunity(It.Is<IReadOnlyCollection<Guid>>(ids => ids.SequenceEqual(expected.Select(item => item.Id)))), Times.Once);
      fixture.Sync.Verify(service => service.GetSyncInfoMyOpportunity(It.IsAny<Guid>()), Times.Never);
      foreach (var item in result.Items!)
      {
        Assert.Same(fixture.Info[item.Id], item.SyncedInfo);
        Assert.Equal($"https://example.org/photo-{item.Id}", item.UserPhotoURL);
        Assert.Equal($"https://example.org/logo-{item.Id}", item.OrganizationLogoURL);
        Assert.Equal($"https://example.org/file-{item.Id}", Assert.Single(item.Verifications!).FileURL);
        Assert.Equal(item.VerificationStatus == VerificationStatus.Pending ? 11 : 10, item.OpportunityParticipantCountTotal);
      }
    }

    [Theory]
    [InlineData(ParticipationAction.Saved)]
    [InlineData(ParticipationAction.Viewed)]
    [InlineData(ParticipationAction.NavigatedExternalLink)]
    public void NonVerificationSearchStillSkipsSyncReads(ParticipationAction action)
    {
      var fixture = new Fixture(action);

      Assert.Equal(12, fixture.Service.Search(fixture.Filter(1), false).Items!.Count);
      fixture.Sync.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("empty-page")]
    [InlineData("count-only")]
    [InlineData("unrestricted")]
    public void ExistingBypassCasesDoNotFetchSync(string scenario)
    {
      var fixture = new Fixture();
      var filter = fixture.Filter(scenario == "empty-page" ? 4 : 1);
      switch (scenario)
      {
        case "empty-page": break;
        case "count-only": SetFilter(filter, "TotalCountOnly", true); break;
        case "unrestricted": SetFilter(filter, "UnrestrictedQuery", true); break;
        default: throw new NotSupportedException(scenario);
      }

      fixture.Service.Search(filter, false);

      fixture.Sync.VerifyNoOtherCalls();
    }

    [Fact]
    public void AuthorizationFailureStillPreventsSyncReads()
    {
      var fixture = new Fixture();
      var filter = fixture.Filter(1);
      filter.Organizations = [fixture.Items[0].OrganizationId];
      var error = new ValidationException("Unauthorized organisation");
      fixture.Organizations.Setup(service => service.IsAdminsOf(It.IsAny<List<Guid>>(), true)).Throws(error);

      Assert.Same(error, Assert.Throws<ValidationException>(() => fixture.Service.Search(filter, true)));
      fixture.Sync.VerifyNoOtherCalls();
    }

    [Fact]
    public void SingleReadRetainsTheSingleSyncLookup()
    {
      var fixture = new Fixture();
      var item = fixture.Items[0];
      fixture.Sync.Setup(service => service.GetSyncInfoMyOpportunity(item.Id)).Returns(fixture.Info[item.Id]);

      Assert.Same(item, fixture.Service.GetById(item.Id, false, true, false));
      fixture.Sync.Verify(service => service.GetSyncInfoMyOpportunity(item.Id), Times.Once);
      fixture.Sync.Verify(service => service.GetSyncInfoMyOpportunity(It.IsAny<IReadOnlyCollection<Guid>>()), Times.Never);
    }

    [Fact]
    public void BatchConsistencyErrorStillFailsSearch()
    {
      var fixture = new Fixture();
      var error = new DataInconsistencyException("Pull synchronization requires exactly one partner");
      fixture.Sync.Setup(service => service.GetSyncInfoMyOpportunity(It.IsAny<IReadOnlyCollection<Guid>>())).Throws(error);

      Assert.Same(error, Assert.Throws<DataInconsistencyException>(() => fixture.Service.Search(fixture.Filter(1), false)));
    }
    #endregion

    #region Fixture
    private static void SetFilter(MyOpportunitySearchFilterAdmin filter, string property, object value)
      => typeof(MyOpportunitySearchFilterBase).GetProperty(property, BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(filter, value);

    private sealed class Fixture
    {
      private readonly ParticipationAction _action;
      private readonly Dictionary<ParticipationAction, Guid> _actions = Enum.GetValues<ParticipationAction>().ToDictionary(action => action, _ => Guid.NewGuid());
      private readonly Dictionary<VerificationStatus, Guid> _statuses = Enum.GetValues<VerificationStatus>().ToDictionary(status => status, _ => Guid.NewGuid());
      internal List<Participation> Items { get; } = [];
      internal Dictionary<Guid, SyncInfoMyOpportunity?> Info { get; } = [];
      internal Mock<ISyncStateService> Sync { get; } = new();
      internal Mock<IOrganizationService> Organizations { get; } = new();
      internal MyOpportunityService Service { get; }

      internal Fixture(ParticipationAction action = ParticipationAction.Verification)
      {
        _action = action;
        var opportunityActiveId = Guid.NewGuid();
        var organizationActiveId = Guid.NewGuid();
        for (var index = 0; index < 25; index++)
        {
          var id = Guid.NewGuid();
          var status = index % 3 == 0 ? VerificationStatus.Pending : index % 3 == 1 ? VerificationStatus.Completed : VerificationStatus.Rejected;
          Items.Add(new Participation
          {
            Id = id,
            UserId = Guid.NewGuid(),
            OpportunityId = Guid.NewGuid(),
            OrganizationId = Guid.NewGuid(),
            Action = action,
            ActionId = _actions[action],
            VerificationStatus = status,
            VerificationStatusId = _statuses[status],
            OpportunityStatusId = opportunityActiveId,
            OrganizationStatusId = organizationActiveId,
            DateStart = DateTimeOffset.UtcNow.AddDays(-1),
            DateModified = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero).AddMinutes(index),
            OpportunityParticipantCountTotal = 10,
            UserPhotoStorageType = StorageType.Public,
            UserPhotoKey = $"photo-{id}",
            OrganizationLogoStorageType = StorageType.Public,
            OrganizationLogoKey = $"logo-{id}",
            Verifications = [new MyOpportunityVerification { FileStorageType = StorageType.Public, FileKey = $"file-{id}" }]
          });
          Info.Add(id, index % 2 == 0 ? null : new SyncInfoMyOpportunity
          { SyncType = SyncType.Pull, Partners = [new SyncInfoMyOpportunityPartner { Partner = SyncPartner.Alison, EntityType = EntityType.MyOpportunity, ExternalId = id.ToString() }] });
        }
        var repository = new Mock<IRepositoryBatchedWithNavigationAndCustomFieldFilter<Participation>>();
        repository.Setup(value => value.Query(true)).Returns(Items.AsQueryable());
        repository.Setup(value => value.Query(false)).Returns(Items.AsQueryable());
        repository.Setup(value => value.WhereCustomFields(It.IsAny<IQueryable<Participation>>(), It.IsAny<List<CustomFieldFilter>?>()))
          .Returns((IQueryable<Participation> query, List<CustomFieldFilter>? _) => query);
        Sync.Setup(service => service.GetSyncInfoMyOpportunity(It.IsAny<IReadOnlyCollection<Guid>>()))
          .Returns((IReadOnlyCollection<Guid> ids) => ids.ToDictionary(id => id, id => Info[id]));
        var actions = new Mock<IMyOpportunityActionService>();
        actions.Setup(service => service.GetByName(It.IsAny<string>())).Returns((string name) =>
          new Domain.MyOpportunity.Models.Lookups.MyOpportunityAction { Id = _actions[Enum.Parse<ParticipationAction>(name)], Name = name });
        var statuses = new Mock<IMyOpportunityVerificationStatusService>();
        statuses.Setup(service => service.GetByName(It.IsAny<string>())).Returns((string name) =>
          new Domain.MyOpportunity.Models.Lookups.MyOpportunityVerificationStatus { Id = _statuses[Enum.Parse<VerificationStatus>(name)], Name = name });
        var opportunityStatuses = new Mock<IOpportunityStatusService>();
        opportunityStatuses.Setup(service => service.GetByName(It.IsAny<string>())).Returns((string name) =>
          new Domain.Opportunity.Models.Lookups.OpportunityStatus { Id = name == Domain.Opportunity.Status.Active.ToString() ? opportunityActiveId : Guid.NewGuid(), Name = name });
        var organizationStatuses = new Mock<IOrganizationStatusService>();
        organizationStatuses.Setup(service => service.GetByName(It.IsAny<string>())).Returns((string name) =>
          new Domain.Entity.Models.Lookups.OrganizationStatus { Id = organizationActiveId, Name = name });
        var blobs = new Mock<IBlobService>();
        blobs.Setup(service => service.GetURL(It.IsAny<StorageType>(), It.IsAny<string>(), null, null))
          .Returns((StorageType _, string key, string? _, int? _) => $"https://example.org/{key}");
        var user = Mock.Of<IUserService>();
        var opportunity = Mock.Of<IOpportunityService>();
        var intervals = Mock.Of<ITimeIntervalService>();
        var countries = Mock.Of<ICountryService>();

        Service = new MyOpportunityService(NullLogger<MyOpportunityService>.Instance, Options.Create(new AppSettings()), new HttpContextAccessor(),
          user, Organizations.Object, opportunity, actions.Object, statuses.Object, opportunityStatuses.Object, organizationStatuses.Object,
          blobs.Object, Mock.Of<ISSICredentialService>(), Mock.Of<IRewardService>(), Mock.Of<ILinkService>(),
          Mock.Of<INotificationURLFactory>(), Mock.Of<INotificationDeliveryService>(), countries, Mock.Of<IGenderService>(), intervals,
          Mock.Of<IDownloadService>(), Mock.Of<IOpportunityVerificationTypeService>(), Mock.Of<IDelayedExecutionService>(),
          Mock.Of<ISyncUserAuthenticationService>(), Sync.Object, Mock.Of<IProcessingService>(), Mock.Of<ICustomFieldDefinitionService>(), Mock.Of<ICustomFieldValueService>(),
          new MyOpportunitySearchFilterVerificationFilesAdminValidator(), new MyOpportunitySearchFilterAdminValidator(), new MyOpportunityRequestValidatorVerify(intervals, countries),
          new MyOpportunityRequestValidatorVerifyFinalize(user, opportunity), new MyOpportunityRequestValidatorVerifyFinalizeBatch(user, opportunity),
          new MyOpportunityRequestValidatorVerifyImportCsv(Organizations.Object), new MyOpportunityRequestValidatorVerifyImportPartnerSync(countries), Mock.Of<IMediator>(),
          repository.Object, Mock.Of<IRepository<MyOpportunityVerification>>(), Mock.Of<IExecutionStrategyService>());
      }

      internal MyOpportunitySearchFilterAdmin Filter(int page)
        => new() { Action = _action, VerificationStatuses = [VerificationStatus.Pending, VerificationStatus.Completed, VerificationStatus.Rejected], PageNumber = page, PageSize = 12 };
    }
    #endregion
  }
}
