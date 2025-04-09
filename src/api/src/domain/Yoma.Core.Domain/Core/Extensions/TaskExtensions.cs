namespace Yoma.Core.Domain.Core.Extensions
{
  public static class TaskExtensions
  {
    public static async Task FlattenAggregateException(this Task task)
    {
      ArgumentNullException.ThrowIfNull(task);

      try
      {
        await task;
      }
      catch (AggregateException ex)
      {
        throw ex.Flatten();
      }
    }

    public static async Task<T> FlattenAggregateException<T>(this Task<T> task)
    {
      ArgumentNullException.ThrowIfNull(task);

      try
      {
        return await task;
      }
      catch (AggregateException ex)
      {
        throw ex.Flatten();
      }
    }
  }
}

