using Yoma.Core.Infrastructure.Jobberman.Context;
using Yoma.Core.Infrastructure.Shared.Services;

namespace Yoma.Core.Infrastructure.Jobberman.Services
{
  public sealed class ExecutionStrategyService : ExecutionStrategyServiceBase
  {
    #region Constructors
    public ExecutionStrategyService(JobbermanDbContext dbContext) : base(dbContext) { }
    #endregion
  }
}
