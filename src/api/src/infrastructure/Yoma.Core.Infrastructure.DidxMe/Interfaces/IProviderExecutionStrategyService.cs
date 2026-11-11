using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Infrastructure.DidxMe.Interfaces
{
  /// <summary>
  /// Execution strategy for provider persistence, separate from the domain database context.
  /// </summary>
  public interface IProviderExecutionStrategyService : IExecutionStrategyService { }
}
