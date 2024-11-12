using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace Yoma.Core.Infrastructure.Shared.Interceptors
{
  public class EmptyStringToNullInterceptor : SaveChangesInterceptor
  {
    public override InterceptionResult<int> SavingChanges(
      DbContextEventData eventData,
      InterceptionResult<int> result)
    {
      HandleEmptyStringConversion(eventData);
      return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
      DbContextEventData eventData,
      InterceptionResult<int> result,
      CancellationToken cancellationToken = default)
    {
      HandleEmptyStringConversion(eventData);
      return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void HandleEmptyStringConversion(DbContextEventData eventData)
    {
      if (eventData.Context != null)
        foreach (var entry in eventData.Context.ChangeTracker.Entries())
          if (entry.State == EntityState.Modified || entry.State == EntityState.Added)
            foreach (var property in entry.Properties)
              if (property.Metadata.ClrType == typeof(string) &&
                  property.CurrentValue is string currentValue &&
                  string.IsNullOrEmpty(currentValue) &&
                  property.Metadata.IsNullable)
                property.CurrentValue = null;
    }
  }
}
