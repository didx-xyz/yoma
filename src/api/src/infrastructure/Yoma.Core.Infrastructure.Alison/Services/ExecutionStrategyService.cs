using Yoma.Core.Infrastructure.Alison.Context;
using Yoma.Core.Infrastructure.Shared.Services;

namespace Yoma.Core.Infrastructure.Alison.Services
{
  public sealed class ExecutionStrategyService : ExecutionStrategyServiceBase
  {
    #region Constructors
    public ExecutionStrategyService(AlisonDbContext dbContext) : base(dbContext) { }
    #endregion
  }
}
