using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Infrastructure.Shared.Services
{
  /// <summary>
  /// Provides a centralized wrapper around EF Core's built-in execution strategy.
  /// Ensures transient faults and concurrency-related exceptions (including PostgreSQL
  /// serialization failures with SQLSTATE 40001) are automatically retried by EF in
  /// almost all cases.
  ///
  /// Default transactions run under PostgreSQL’s standard READ COMMITTED isolation level.
  /// Critical flows explicitly request SERIALIZABLE isolation via TransactionScopeHelper.CreateReadCommitted()
  /// to guarantee atomicity and prevent double-counting under high concurrency.
  ///
  /// Combined with explicit transaction scopes and distributed (Redis) locks for
  /// mission-critical sections, this provides robust protection against race conditions
  /// without requiring custom retry logic.
  /// </summary>
  public abstract class ExecutionStrategyServiceBase : IExecutionStrategyService
  {
    #region Class Variables
    private readonly DbContext _context;
    #endregion

    #region Constructors
    public ExecutionStrategyServiceBase(DbContext context)
    {
      _context = context ?? throw new ArgumentNullException(nameof(context));
    }
    #endregion

    #region Public Members
    public async Task ExecuteInExecutionStrategyAsync(Func<Task> transactionBody)
    {
      var executionStrategy = _context.Database.CreateExecutionStrategy();

      await executionStrategy.ExecuteAsync(transactionBody.Invoke);
    }

    public void ExecuteInExecutionStrategy(Action transactionBody)
    {
      var executionStrategy = _context.Database.CreateExecutionStrategy();

      executionStrategy.Execute(transactionBody.Invoke);
    }
    #endregion
  }
}
