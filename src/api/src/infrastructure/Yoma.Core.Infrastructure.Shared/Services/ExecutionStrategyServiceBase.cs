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
  /// Combined with global SERIALIZABLE isolation (via interceptor) and explicit
  /// transaction scopes, this provides robust protection against race conditions
  /// without additional manual retry logic. EF’s execution strategy internally retries
  /// 40001 conflicts when detected by Npgsql, which is sufficient for 99% of cases.
  ///
  /// For mission-critical, high-value flows, additional distributed (Redis) locks are
  /// applied at service level to further reduce contention.
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
