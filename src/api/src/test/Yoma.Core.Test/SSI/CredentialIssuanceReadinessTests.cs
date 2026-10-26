using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Test.SSI
{
  public class CredentialIssuanceReadinessTests
  {
    #region Tests
    [Fact]
    public void ReplaySelectionIsSeparateFromTenantReadyIssuanceAndHasDeterministicPaging()
    {
      var fixture = new Fixture();
      var first = fixture.AddOpportunity(false);
      var second = fixture.AddOpportunity(false);
      fixture.AddOpportunity(true);
      first.Status = CredentialIssuanceStatus.Replay;
      first.StatusId = fixture.ReplayId;
      second.Status = CredentialIssuanceStatus.Replay;
      second.StatusId = fixture.ReplayId;
      second.DateModified = first.DateModified;
      var ordered = new[] { first, second }.OrderBy(item => item.Id).ToList();

      Assert.True(fixture.Service.HasReplayIssuanceSchedule());
      Assert.Same(ordered[0], Assert.Single(fixture.Service.ListReplayIssuanceSchedule(1, [])));
      Assert.Same(ordered[1], Assert.Single(fixture.Service.ListReplayIssuanceSchedule(1, [ordered[0].Id])));
      Assert.Empty(fixture.Service.ListReplayIssuanceSchedule(1, [first.Id, second.Id]));
      Assert.Single(fixture.Service.ListPendingIssuanceSchedule(10, []));
      fixture.Repository.Verify(repository => repository.Update(It.IsAny<SSICredentialIssuance>()), Times.Never);
    }

    [Fact]
    public void TenantReadyItemsAreSelectedBeforePagingPastAnOlderBlockedBacklog()
    {
      var fixture = new Fixture();
      for (var index = 0; index < 40; index++) fixture.AddOpportunity(false);
      var ready = Enumerable.Range(0, 23).Select(_ => fixture.AddOpportunity(true)).ToList();

      var first = fixture.Service.ListPendingIssuanceSchedule(10, []);
      var second = fixture.Service.ListPendingIssuanceSchedule(10, [.. first.Select(item => item.Id)]);
      var last = fixture.Service.ListPendingIssuanceSchedule(10, [.. first.Concat(second).Select(item => item.Id)]);

      Assert.Equal(10, first.Count);
      Assert.Equal(10, second.Count);
      Assert.Equal(3, last.Count);
      Assert.Equal(ready.Select(item => item.Id), first.Concat(second).Concat(last).Select(item => item.Id));
      Assert.All(fixture.Items, item =>
      {
        Assert.Equal(CredentialIssuanceStatus.Pending, item.Status);
        Assert.Null(item.RetryCount);
        Assert.Null(item.ErrorReason);
      });
      fixture.Repository.Verify(repository => repository.Update(It.IsAny<SSICredentialIssuance>()), Times.Never);
    }

    [Theory]
    [InlineData("missing-holder")]
    [InlineData("missing-issuer")]
    [InlineData("holder-pending")]
    [InlineData("issuer-error")]
    [InlineData("holder-empty")]
    [InlineData("issuer-null")]
    [InlineData("wrong-holder")]
    [InlineData("wrong-issuer")]
    [InlineData("wrong-entity-type")]
    [InlineData("missing-participation")]
    public void BothMatchingCreatedTenantsWithIdsAreRequired(string blockedReason)
    {
      var fixture = new Fixture();
      fixture.AddOpportunity(true);
      var holder = fixture.Tenants[0];
      var issuer = fixture.Tenants[1];
      switch (blockedReason)
      {
        case "missing-holder": fixture.Tenants.Remove(holder); break;
        case "missing-issuer": fixture.Tenants.Remove(issuer); break;
        case "holder-pending": holder.StatusId = Guid.NewGuid(); holder.Status = TenantCreationStatus.Pending; break;
        case "issuer-error": issuer.StatusId = Guid.NewGuid(); issuer.Status = TenantCreationStatus.Error; break;
        case "holder-empty": holder.TenantId = string.Empty; break;
        case "issuer-null": issuer.TenantId = null; break;
        case "wrong-holder": holder.UserId = Guid.NewGuid(); break;
        case "wrong-issuer": issuer.OrganizationId = Guid.NewGuid(); break;
        case "wrong-entity-type": holder.EntityType = EntityType.Organization.ToString(); break;
        case "missing-participation": fixture.Participations.Clear(); break;
        default: throw new NotSupportedException($"Blocked reason '{blockedReason}' is not supported");
      }

      Assert.Empty(fixture.Service.ListPendingIssuanceSchedule(10, []));
    }

    [Fact]
    public void ReadyTenantsAreCaseInsensitiveAndBlockedItemsBecomeEligibleWithoutRequeueing()
    {
      var fixture = new Fixture();
      var item = fixture.AddOpportunity(false);
      var modified = item.DateModified;
      Assert.Empty(fixture.Service.ListPendingIssuanceSchedule(10, []));
      fixture.AddTenants(fixture.Participations.Single());
      fixture.Tenants[0].EntityType = "uSeR";
      fixture.Tenants[1].EntityType = "oRgAnIzAtIoN";

      Assert.Same(item, Assert.Single(fixture.Service.ListPendingIssuanceSchedule(10, [])));
      Assert.Equal(modified, item.DateModified);
      Assert.Null(item.RetryCount);
    }

    [Fact]
    public void ScheduledChoicesSurviveLaterOpportunityChangesAndYoIdKeepsItsExistingPath()
    {
      var fixture = new Fixture();
      var opportunity = fixture.AddOpportunity(true);
      opportunity.SchemaName = "Opportunity|Custom";
      var participation = fixture.Participations.Single();
      participation.OpportunityCredentialIssuanceEnabled = false;
      participation.OpportunitySSISchemaName = null;
      participation.OpportunityStatus = Domain.Opportunity.Status.Deleted;
      fixture.Items.Add(new SSICredentialIssuance
      {
        Id = Guid.NewGuid(),
        SchemaTypeId = Guid.NewGuid(),
        SchemaType = SchemaType.YoID,
        StatusId = fixture.PendingId,
        UserId = Guid.NewGuid(),
        SchemaName = "YoID|Default",
        ArtifactType = ArtifactType.ACR,
        DateModified = opportunity.DateModified.AddMinutes(1)
      });

      var results = fixture.Service.ListPendingIssuanceSchedule(10, []);

      Assert.Equal(2, results.Count);
      Assert.Same(opportunity, results[0]);
      Assert.Equal("Opportunity|Custom", results[0].SchemaName);
      Assert.Equal(SchemaType.YoID, results[1].SchemaType);
    }

    [Fact]
    public void PendingStatusSkipListAndDeterministicOrderingArePreserved()
    {
      var fixture = new Fixture();
      var first = fixture.AddOpportunity(true);
      var second = fixture.AddOpportunity(true);
      second.DateModified = first.DateModified;
      var error = fixture.AddOpportunity(true);
      error.StatusId = Guid.NewGuid();
      error.Status = CredentialIssuanceStatus.Error;
      var expected = new[] { first, second }.OrderBy(item => item.Id).ToList();

      Assert.Equal(expected, fixture.Service.ListPendingIssuanceSchedule(10, []));
      Assert.Same(expected[1], Assert.Single(fixture.Service.ListPendingIssuanceSchedule(1, [expected[0].Id])));
    }

    #endregion Tests

    #region Fixture
    private sealed class Fixture
    {
      public Guid PendingId { get; } = Guid.NewGuid();
      public Guid ReplayId { get; } = Guid.NewGuid();
      public Guid OpportunityTypeId { get; } = Guid.NewGuid();
      private readonly Guid _tenantCreatedId = Guid.NewGuid();
      public List<SSICredentialIssuance> Items { get; } = [];
      public List<SSITenantCreation> Tenants { get; } = [];
      public List<Domain.MyOpportunity.Models.MyOpportunity> Participations { get; } = [];
      public Mock<IRepository<SSICredentialIssuance>> Repository { get; } = new();
      public Mock<IRepository<SSITenantCreation>> TenantRepository { get; } = new();
      public Mock<IRepositoryBatchedWithNavigationAndCustomFieldFilter<Domain.MyOpportunity.Models.MyOpportunity>> ParticipationRepository { get; } = new();
      public SSICredentialService Service { get; }

      public Fixture()
      {
        var statuses = new Mock<ISSICredentialIssuanceStatusService>();
        statuses.Setup(service => service.GetByName(CredentialIssuanceStatus.Pending.ToString()))
          .Returns(new SSICredentialIssuanceStatus { Id = PendingId });
        statuses.Setup(service => service.GetByName(CredentialIssuanceStatus.Replay.ToString()))
          .Returns(new SSICredentialIssuanceStatus { Id = ReplayId });
        var types = new Mock<ISSISchemaTypeService>();
        types.Setup(service => service.GetByName(SchemaType.Opportunity.ToString()))
          .Returns(new SSISchemaType { Id = OpportunityTypeId });
        var tenantStatuses = new Mock<ISSITenantCreationStatusService>();
        tenantStatuses.Setup(service => service.GetByName(TenantCreationStatus.Created.ToString()))
          .Returns(new SSITenantCreationStatus { Id = _tenantCreatedId });
        Repository.Setup(repository => repository.Query()).Returns(() => Items.AsQueryable());
        TenantRepository.Setup(repository => repository.Query()).Returns(() => Tenants.AsQueryable());
        ParticipationRepository.Setup(repository => repository.Query()).Returns(() => Participations.AsQueryable());
        Service = new SSICredentialService(Options.Create(new AppSettings()), Mock.Of<ISSISchemaService>(),
          statuses.Object, Repository.Object, types.Object, tenantStatuses.Object,
          TenantRepository.Object, ParticipationRepository.Object);
      }

      public SSICredentialIssuance AddOpportunity(bool ready)
      {
        var participation = new Domain.MyOpportunity.Models.MyOpportunity
        {
          Id = Guid.NewGuid(),
          OpportunityId = Guid.NewGuid(),
          UserId = Guid.NewGuid(),
          OrganizationId = Guid.NewGuid()
        };
        Participations.Add(participation);
        var item = new SSICredentialIssuance
        {
          Id = Guid.NewGuid(),
          SchemaTypeId = OpportunityTypeId,
          SchemaType = SchemaType.Opportunity,
          StatusId = PendingId,
          Status = CredentialIssuanceStatus.Pending,
          MyOpportunityId = participation.Id,
          SchemaName = "Opportunity|Default",
          ArtifactType = ArtifactType.JWS,
          DateCreated = DateTimeOffset.UtcNow,
          DateModified = DateTimeOffset.UtcNow
        };
        Items.Add(item);
        if (ready) AddTenants(participation);
        return item;
      }

      public void AddTenants(Domain.MyOpportunity.Models.MyOpportunity participation)
      {
        Tenants.Add(new SSITenantCreation
        {
          Id = Guid.NewGuid(),
          EntityType = EntityType.User.ToString(),
          UserId = participation.UserId,
          StatusId = _tenantCreatedId,
          Status = TenantCreationStatus.Created,
          TenantId = "holder"
        });
        Tenants.Add(new SSITenantCreation
        {
          Id = Guid.NewGuid(),
          EntityType = EntityType.Organization.ToString(),
          OrganizationId = participation.OrganizationId,
          StatusId = _tenantCreatedId,
          Status = TenantCreationStatus.Created,
          TenantId = "issuer"
        });
      }
    }
    #endregion Fixture
  }
}
