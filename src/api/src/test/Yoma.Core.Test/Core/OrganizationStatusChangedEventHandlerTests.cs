using MediatR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Events;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Events;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Test.Core
{
  public class OrganizationStatusChangedEventHandlerTests
  {
    #region Class Variables
    private static readonly int[] ExpectedPages = [1, 2, 3];
    private static readonly Status[] ActiveStatuses = [Status.Active];
    private static readonly Status[] DeletedStatuses = [Status.Active, Status.Inactive, Status.Expired];
    #endregion

    #region Tests
    [Theory]
    [InlineData(OrganizationStatus.Active, EventType.Update)]
    [InlineData(OrganizationStatus.Inactive, EventType.Update)]
    [InlineData(OrganizationStatus.Deleted, EventType.Delete)]
    public async Task Handle_PreservesFilteredPagingAndPublishesEveryNonemptyPage(OrganizationStatus status, EventType eventType)
    {
      var organization = new Organization { Id = Guid.NewGuid(), Status = status };
      var first = new Opportunity { Id = Guid.NewGuid() };
      var second = new Opportunity { Id = Guid.NewGuid() };
      var pages = new List<int>();
      var service = new Mock<IOpportunityService>(MockBehavior.Strict);
      service.Setup(o => o.Search(It.IsAny<OpportunitySearchFilterAdmin>(), false, false))
        .Returns((OpportunitySearchFilterAdmin filter, bool _, bool __) =>
        {
          Assert.Equal(organization.Id, Assert.Single(filter.Organizations!));
          Assert.Equal(100, filter.PageSize);
          Assert.Equal(status == OrganizationStatus.Deleted
            ? DeletedStatuses
            : ActiveStatuses, filter.Statuses);
          pages.Add(filter.PageNumber!.Value);
          return new OpportunitySearchResults
          {
            TotalCount = 2,
            Items = filter.PageNumber switch { 1 => [first], 2 => [second], _ => [] }
          };
        });
      var published = new List<OpportunityEvent>();
      var mediator = new Mock<IMediator>();
      mediator.Setup(o => o.Publish(It.IsAny<OpportunityEvent>(), It.IsAny<CancellationToken>()))
        .Callback<OpportunityEvent, CancellationToken>((item, _) => published.Add(item))
        .Returns(Task.CompletedTask);
      var handler = new OrganizationStatusChangedEventHandler(
        NullLogger<OrganizationStatusChangedEventHandler>.Instance, service.Object, mediator.Object);

      await handler.Handle(new OrganizationStatusChangedEvent(organization), CancellationToken.None);

      Assert.Equal(ExpectedPages, pages);
      Assert.Equal([first.Id, second.Id], published.Select(o => o.Entity.Id));
      Assert.All(published, o => Assert.Equal(eventType, o.EventType));
      service.Verify(o => o.Search(It.IsAny<OpportunitySearchFilterAdmin>(), false, false), Times.Exactly(3));
    }

    [Fact]
    public async Task Handle_Declined_DoesNotSearchOrPublish()
    {
      var service = new Mock<IOpportunityService>(MockBehavior.Strict);
      var mediator = new Mock<IMediator>(MockBehavior.Strict);
      var handler = new OrganizationStatusChangedEventHandler(
        NullLogger<OrganizationStatusChangedEventHandler>.Instance, service.Object, mediator.Object);

      await handler.Handle(new OrganizationStatusChangedEvent(new Organization { Status = OrganizationStatus.Declined }), CancellationToken.None);

      service.VerifyNoOtherCalls();
      mediator.VerifyNoOtherCalls();
    }
    #endregion
  }
}
