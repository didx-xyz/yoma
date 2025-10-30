using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Shared.Services;

namespace Yoma.Core.Infrastructure.Database.Core.Services
{
  public sealed class ExecutionStrategyService : ExecutionStrategyServiceBase
  {
    #region Constructors
    public ExecutionStrategyService(ApplicationDbContext dbContext) : base(dbContext) { }
    #endregion
  }
}
