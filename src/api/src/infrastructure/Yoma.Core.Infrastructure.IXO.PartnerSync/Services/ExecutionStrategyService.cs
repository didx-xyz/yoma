using Yoma.Core.Infrastructure.IXO.PartnerSync.Context;
using Yoma.Core.Infrastructure.Shared.Services;

namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Services
{
  public sealed class ExecutionStrategyService : ExecutionStrategyServiceBase
  {
    #region Constructor
    public ExecutionStrategyService(IXOPartnerSyncDbContext dbContext) : base(dbContext) { }
    #endregion
  }
}
