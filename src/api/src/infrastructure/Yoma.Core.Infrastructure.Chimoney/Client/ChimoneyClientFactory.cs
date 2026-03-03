using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Infrastructure.Chimoney.Models;

namespace Yoma.Core.Infrastructure.Chimoney.Client
{
  public sealed class ChimoneyClientFactory : IRewardCashOutProviderClientFactory
  {
    #region Class Variables
    private readonly ChimoneyOptions _options;
    #endregion

    #region Constructor
    public ChimoneyClientFactory(IOptions<ChimoneyOptions> options)
    {
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
    }
    #endregion

    public IRewardCashOutProviderClient CreateClient()
    {
      return new ChimoneyClient(_options);
    }
  }
}
