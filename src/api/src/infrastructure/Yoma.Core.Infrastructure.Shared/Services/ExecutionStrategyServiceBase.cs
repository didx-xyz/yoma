using System.Transactions;
using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Infrastructure.Shared.Services
{
  /// <summary>
  /// Centralized wrapper around EF Core's <see cref="IExecutionStrategy"/> (e.g. NpgsqlRetryingExecutionStrategy).
  ///
  /// Purpose:
  /// - Lets EF automatically retry transient failures (network blips, timeouts, certain deadlocks / serialization failures, etc.).
  /// - Keeps retry behavior consistent across the codebase.
  ///
  /// TransactionScope interaction (critical):
  /// - EF execution strategies retry by re-invoking the supplied delegate from the start.
  /// - An ambient <see cref="TransactionScope"/> cannot be safely "replayed" once work has started:
  ///     • The scope may already have acquired row locks (FOR UPDATE / WAIT) or executed writes.
  ///     • Re-running the delegate can cause partial side-effects, double increments, or invalid transaction state exceptions.
  ///     • You can also hit "TransactionScope has completed" / "The transaction is in doubt" type failures.
  ///
  /// Therefore:
  /// - If an ambient transaction exists (<see cref="Transaction.Current"/> != null), we MUST NOT wrap the delegate in an EF execution strategy.
  /// - The correct retry boundary is the OUTERMOST unit-of-work, where the execution strategy creates the transaction/scope
  ///   inside the delegate. Nested scopes/operations inside that ambient transaction execute directly (no inner retries).
  ///
  /// This is aligned with EF Core guidance: execution strategies should not be used within an existing user-initiated transaction
  /// (including TransactionScope). The strategy should own the retry + transaction boundary, not sit inside it.
  /// </summary>
  public abstract class ExecutionStrategyServiceBase : IExecutionStrategyService
  {
    private readonly DbContext _context;

    protected ExecutionStrategyServiceBase(DbContext context)
    {
      _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task ExecuteInExecutionStrategyAsync(Func<Task> transactionBody)
    {
      ArgumentNullException.ThrowIfNull(transactionBody);

      // IMPORTANT:
      // If an ambient TransactionScope exists, we are already inside a user-initiated transaction.
      // EF's execution strategy may retry by re-invoking the delegate, but TransactionScope cannot be safely retried once
      // it has begun doing work (locks/writes). In this scenario we execute directly and rely on the OUTER strategy/scope
      // boundary (the top-level unit of work) to handle retries.
      if (Transaction.Current != null)
      {
        await transactionBody.Invoke();
        return;
      }

      var executionStrategy = _context.Database.CreateExecutionStrategy();
      await executionStrategy.ExecuteAsync(transactionBody.Invoke);
    }

    public void ExecuteInExecutionStrategy(Action transactionBody)
    {
      ArgumentNullException.ThrowIfNull(transactionBody);

      // See async version for the reasoning.
      if (Transaction.Current != null)
      {
        transactionBody.Invoke();
        return;
      }

      var executionStrategy = _context.Database.CreateExecutionStrategy();
      executionStrategy.Execute(transactionBody.Invoke);
    }
  }
}
