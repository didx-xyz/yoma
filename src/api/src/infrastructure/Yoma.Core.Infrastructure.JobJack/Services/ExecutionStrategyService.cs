using Yoma.Core.Infrastructure.JobJack.Context;
using Yoma.Core.Infrastructure.Shared.Services;

namespace Yoma.Core.Infrastructure.JobJack.Services
{
  public sealed class ExecutionStrategyService : ExecutionStrategyServiceBase
  {
    #region Constructors
    public ExecutionStrategyService(JobJackDbContext dbContext) : base(dbContext) { }
    #endregion
  }
}
