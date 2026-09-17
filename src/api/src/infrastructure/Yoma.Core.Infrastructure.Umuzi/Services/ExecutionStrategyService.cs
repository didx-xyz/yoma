using Yoma.Core.Infrastructure.Umuzi.Context;
using Yoma.Core.Infrastructure.Shared.Services;
using Yoma.Core.Infrastructure.Umuzi.Interfaces;

namespace Yoma.Core.Infrastructure.Umuzi.Services
{
  public sealed class ExecutionStrategyService : ExecutionStrategyServiceBase, IUmuziExecutionStrategyService
  {
    #region Constructor
    public ExecutionStrategyService(UmuziDbContext dbContext) : base(dbContext) { }
    #endregion
  }
}
