using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data;
using System.Data.Common;

namespace Yoma.Core.Infrastructure.Shared.Interceptors
{
  /// <summary>
  /// Enforces SERIALIZABLE isolation level for all database transactions,
  /// both implicit and explicit, ensuring the highest consistency guarantees
  /// across concurrent operations.
  ///
  /// Works transparently with EF Core’s execution strategy and PostgreSQL’s
  /// snapshot isolation model to prevent race conditions and write conflicts.
  /// </summary>
  public sealed class SerializableTransactionInterceptor : DbTransactionInterceptor
  {
    public override InterceptionResult<DbTransaction> TransactionStarting(
        DbConnection connection,
        TransactionStartingEventData eventData,
        InterceptionResult<DbTransaction> result)
    {
      var serializableTx = connection.BeginTransaction(IsolationLevel.Serializable);

      return InterceptionResult<DbTransaction>.SuppressWithResult(serializableTx);
    }

    public override async ValueTask<InterceptionResult<DbTransaction>> TransactionStartingAsync(
        DbConnection connection,
        TransactionStartingEventData eventData,
        InterceptionResult<DbTransaction> result,
        CancellationToken cancellationToken = default)
    {
      var serializableTx = await connection.BeginTransactionAsync(
          IsolationLevel.Serializable,
          cancellationToken);

      return InterceptionResult<DbTransaction>.SuppressWithResult(serializableTx);
    }
  }
}
