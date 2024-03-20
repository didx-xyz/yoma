using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;

namespace Yoma.Core.Infrastructure.Database.Core.Services
{
  public class ExecutionStrategyService : IExecutionStrategyService
  {
    #region Class Variables
    protected readonly ApplicationDbContext _context;
    #endregion

    #region Constructors
    public ExecutionStrategyService(ApplicationDbContext context)
    {
      _context = context;
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

      executionStrategy.Execute(() =>
      {
        transactionBody.Invoke();
      });
    }
    #endregion
  }
}
