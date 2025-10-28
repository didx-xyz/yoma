using System.Transactions;

namespace Yoma.Core.Domain.Core.Helpers
{
  /// <summary>
  /// Helper for creating TransactionScope with PostgreSQL-optimized defaults and full flexibility.
  /// </summary>
  public static class TransactionScopeHelper
  {
    /// <summary>
    /// Creates a TransactionScope with ReadCommitted isolation.
    /// Default scopeOption = Required (matches .NET's default behavior).
    /// </summary>
    /// <param name="scopeOption">Optional: Required (default), RequiresNew, or Suppress</param>
    public static TransactionScope CreateReadCommitted(TransactionScopeOption scopeOption = TransactionScopeOption.Required)
        => new(scopeOption, new TransactionOptions { IsolationLevel = IsolationLevel.ReadCommitted }, TransactionScopeAsyncFlowOption.Enabled);

    /// <summary>
    /// Creates a TransactionScope with Serializable isolation.
    /// Use only with retry logic for proven race conditions.
    /// </summary>
    /// <param name="scopeOption">Optional: Required (default), RequiresNew, or Suppress</param>
    public static TransactionScope CreateSerializable(TransactionScopeOption scopeOption = TransactionScopeOption.Required)
      => new(scopeOption, new TransactionOptions { IsolationLevel = IsolationLevel.Serializable }, TransactionScopeAsyncFlowOption.Enabled);
  }
}
