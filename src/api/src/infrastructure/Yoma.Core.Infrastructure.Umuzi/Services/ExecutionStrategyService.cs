using Yoma.Core.Infrastructure.Umuzi.Context;
using Yoma.Core.Infrastructure.Shared.Services;

namespace Yoma.Core.Infrastructure.Umuzi.Services
{
  public sealed class ExecutionStrategyService : ExecutionStrategyServiceBase
  {
    #region Constructor
    public ExecutionStrategyService(UmuziDbContext dbContext) : base(dbContext) { }
    #endregion
  }
}
