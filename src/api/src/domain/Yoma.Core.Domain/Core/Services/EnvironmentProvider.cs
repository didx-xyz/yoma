using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Services
{
  public class EnvironmentProvider : IEnvironmentProvider
  {
    public EnvironmentProvider(string environment)
    {
      Environment = EnvironmentHelper.FromString(environment);
    }

    public Environment Environment { get; }
  }
}
