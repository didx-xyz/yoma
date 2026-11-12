using Yoma.Core.Infrastructure.DidxMe.Context;
using Yoma.Core.Infrastructure.Shared.Services;

namespace Yoma.Core.Infrastructure.DidxMe.Services
{
  public sealed class ExecutionStrategyService : ExecutionStrategyServiceBase
  {
    #region Constructors
    public ExecutionStrategyService(ProviderDbContext context) : base(context) { }
    #endregion
  }
}
