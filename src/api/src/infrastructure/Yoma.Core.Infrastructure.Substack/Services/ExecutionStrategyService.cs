using Yoma.Core.Infrastructure.Shared.Services;
using Yoma.Core.Infrastructure.Substack.Context;

namespace Yoma.Core.Infrastructure.Substack.Services
{
  public sealed class ExecutionStrategyService : ExecutionStrategyServiceBase
  {
    #region Constructors
    public ExecutionStrategyService(SubstackDbContext dbContext) : base(dbContext) { }
    #endregion
  }
}
