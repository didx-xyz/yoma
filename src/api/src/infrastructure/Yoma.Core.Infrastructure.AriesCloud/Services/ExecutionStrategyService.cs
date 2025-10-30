using Yoma.Core.Infrastructure.AriesCloud.Context;
using Yoma.Core.Infrastructure.Shared.Services;

namespace Yoma.Core.Infrastructure.AriesCloud.Services
{
  public sealed class ExecutionStrategyService : ExecutionStrategyServiceBase
  {
    #region Constructors
    public ExecutionStrategyService(AriesCloudDbContext dbContext) : base(dbContext) { }
    #endregion
  }
}
