namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IEventPublisher
  {
    Task Publish<TEvent>(TEvent @event, CancellationToken ct = default)
        where TEvent : notnull;
  }
}
