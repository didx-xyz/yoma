using Moq;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Test.SSI
{
  internal static class CredentialTestHelper
  {
    internal static IExecutionStrategyService ExecutionStrategy()
    {
      var result = new Mock<IExecutionStrategyService>();
      result.Setup(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), It.IsAny<bool>()))
        .Returns((Func<Task> action, bool _) => action());

      return result.Object;
    }

    internal static IRepository<SSICredentialIssuance> EmptyRepository()
    {
      var result = new Mock<IRepository<SSICredentialIssuance>>();
      result.Setup(repository => repository.Query()).Returns(Array.Empty<SSICredentialIssuance>().AsQueryable());

      return result.Object;
    }
  }
}
