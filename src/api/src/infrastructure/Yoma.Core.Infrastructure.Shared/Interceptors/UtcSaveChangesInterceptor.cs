using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Yoma.Core.Infrastructure.Shared.Interceptors
{
  public class UtcSaveChangesInterceptor : SaveChangesInterceptor
  {
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
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

      return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
  }
}
