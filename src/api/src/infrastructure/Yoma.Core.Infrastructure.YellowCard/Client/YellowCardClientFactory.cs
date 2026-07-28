using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Infrastructure.YellowCard.Models;

namespace Yoma.Core.Infrastructure.YellowCard.Client
{
  public sealed class YellowCardClientFactory : IRewardCashOutProviderClientFactory
  {
    #region Class Variables
    private readonly YellowCardOptions _options;
    #endregion

    #region Constructor
    public YellowCardClientFactory(IOptions<YellowCardOptions> options)
    {
      ArgumentNullException.ThrowIfNull(options, nameof(options));
      _options = options.Value;
    }
    #endregion

    public IRewardCashOutProviderClient CreateClient()
    {
      return new YellowCardClient(_options);
    }
  }
}
