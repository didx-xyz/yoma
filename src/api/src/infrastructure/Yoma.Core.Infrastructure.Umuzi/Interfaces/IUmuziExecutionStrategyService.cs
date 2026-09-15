using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Infrastructure.Umuzi.Interfaces
{
  // Keep retry execution tied to the Umuzi DbContext without replacing the shared
  // IExecutionStrategyService registration used by domain/other partner services.
  public interface IUmuziExecutionStrategyService : IExecutionStrategyService { }
}
