using Hangfire;

namespace Yoma.Core.Api.Middleware
{
  public class HangfireActivatorScope : JobActivatorScope
  {
    readonly IServiceScope _serviceScope;

    public HangfireActivatorScope(IServiceScope serviceScope)
    {
      ArgumentNullException.ThrowIfNull(serviceScope);

      _serviceScope = serviceScope;
    }

    public override object Resolve(Type type)
    {
      return ActivatorUtilities.GetServiceOrCreateInstance(_serviceScope.ServiceProvider, type);
    }
  }
}
