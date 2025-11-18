using MediatR;

namespace Yoma.Core.Domain.Core.Events
{
  public class BaseEvent<T> : INotification
    where T : class
  {
    #region Constructor
    /// <summary>
    /// Represents a business or non-CRUD
    /// </summary>
    public BaseEvent(T entity)
    {
      Entity = entity;
    }

    /// <summary>
    /// Represents a CRUD-style event
    /// </summary>
    public BaseEvent(EventType eventType, T entity)
    {
      EventType = eventType;
      Entity = entity;
    }
    #endregion

    #region Public Memberst
    public EventType? EventType { get; init; }

    public T Entity { get; init; }
    #endregion
  }
}
