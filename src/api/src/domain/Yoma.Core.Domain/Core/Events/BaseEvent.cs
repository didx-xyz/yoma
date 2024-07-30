using MediatR;

namespace Yoma.Core.Domain.Core.Events
{
  public class BaseEvent<T> : INotification
    where T : class
  {
    #region Constructor
    public BaseEvent(EventType eventType, T entity)
    {
      EventType = eventType;
      Entity = entity;
    } 
    #endregion

    #region Public Members
    public EventType EventType { get; set; }

    public T Entity { get; set; }
    #endregion

  }
}
