using System.Transactions;

namespace Yoma.Core.Domain.Core.Helpers
{
  /// <summary>
  /// Helper for creating <see cref="TransactionScope"/> instances with PostgreSQL-optimized defaults.
  /// An inner scope does not inherit the outer scope’s isolation level — it must match the ambient
  /// transaction’s IsolationLevel exactly, regardless of whether it is more or less restrictive,
  /// or start a new transaction using <see cref="TransactionScopeOption.RequiresNew"/>.
  /// </summary>
  public static class TransactionScopeHelper
  {
    /// <summary>
    /// Creates a <see cref="TransactionScope"/> using <see cref="IsolationLevel.ReadCommitted"/>.
    /// This is the recommended and default option — aligns with EF Core behavior and
    /// works correctly with explicit row-level locking (e.g. FOR UPDATE / SKIP LOCKED).
    /// If timeout is not supplied, TransactionManager.DefaultTimeout is used
    /// </summary>
    /// <param name="scopeOption">Optional: Required (default), RequiresNew, or Suppress.</param>
    public static TransactionScope CreateReadCommitted(TransactionScopeOption scopeOption = TransactionScopeOption.Required, TimeSpan? timeout = null)
      => new(scopeOption,
             new TransactionOptions
             {
               IsolationLevel = IsolationLevel.ReadCommitted,
               Timeout = timeout ?? TransactionManager.DefaultTimeout
             },
             TransactionScopeAsyncFlowOption.Enabled);

    /// <summary>
    /// Creates a <see cref="TransactionScope"/> using <see cref="IsolationLevel.Serializable"/>.
    /// Avoid using this by default — prefer <see cref="IsolationLevel.ReadCommitted"/> with explicit
    /// locking and database constraints for concurrency control.
    /// Only use this if a proven race condition cannot be solved with targeted locks.
    /// If timeout is not supplied, TransactionManager.DefaultTimeout is used
    /// </summary>
    /// <param name="scopeOption">Optional: Required (default), RequiresNew, or Suppress.</param>
    public static TransactionScope CreateSerializable(TransactionScopeOption scopeOption = TransactionScopeOption.Required, TimeSpan? timeout = null)
      => new(scopeOption,
             new TransactionOptions
             {
               IsolationLevel = IsolationLevel.Serializable,
               Timeout = timeout ?? TransactionManager.DefaultTimeout
             },
             TransactionScopeAsyncFlowOption.Enabled);
  }
}
