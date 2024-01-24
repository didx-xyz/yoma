using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.AriesCloud.Context;

namespace Yoma.Core.Infrastructure.AriesCloud.Services
{
    public class ExecutionStrategyService : IExecutionStrategyService
    {
        #region Class Variables
        protected readonly AriesCloudDbContext _context;
        #endregion

        #region Constructors
        public ExecutionStrategyService(AriesCloudDbContext context)
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
