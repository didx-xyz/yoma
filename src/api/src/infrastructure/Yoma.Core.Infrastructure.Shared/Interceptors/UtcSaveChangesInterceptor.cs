using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Yoma.Core.Infrastructure.Shared.Interceptors
{
  public class UtcSaveChangesInterceptor : SaveChangesInterceptor
  {
    public override InterceptionResult<int> SavingChanges(
      DbContextEventData eventData,
      InterceptionResult<int> result)
    {
      HandleDateTimeOffsetConversion(eventData);
      return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
      DbContextEventData eventData,
      InterceptionResult<int> result,
      CancellationToken cancellationToken = default)
    {
      HandleDateTimeOffsetConversion(eventData);
      return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void HandleDateTimeOffsetConversion(DbContextEventData eventData)
    {
      if (eventData.Context != null)
        foreach (var entry in eventData.Context.ChangeTracker.Entries())
        {
          foreach (var property in entry.OriginalValues.Properties)
          {
            if (property.ClrType == typeof(DateTimeOffset))
            {
              var originalValue = entry.OriginalValues[property];
              if (originalValue is DateTimeOffset originalDateTimeOffset)
              {
                entry.OriginalValues[property] = originalDateTimeOffset.ToUniversalTime();
              }
            }
          }
        }
    }
  }
}
