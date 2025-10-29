using MediatR;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Services
{
  public sealed class EventPublisher : IEventPublisher
  {
    #region Class Variables
    private readonly IMediator _mediator;
    #endregion

    #region Constructor
    public EventPublisher(IMediator mediator)
    {
      _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }
    #endregion

    #region Public Members
    public async Task Publish<TEvent>(TEvent @event, CancellationToken ct = default)
      where TEvent : notnull
    {
      await _mediator.Publish(@event, ct);
    }
    #endregion
  }
}
