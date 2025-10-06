using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Substack.Context;

namespace Yoma.Core.Infrastructure.Substack.Services
{ 
  public class ExecutionStrategyService : IExecutionStrategyService
  {
    #region Class Variables
    protected readonly SubstackDbContext _context;
    #endregion

    #region Constructors
    public ExecutionStrategyService(SubstackDbContext context)
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

      executionStrategy.Execute(transactionBody.Invoke);
    }
    #endregion
  }
}
