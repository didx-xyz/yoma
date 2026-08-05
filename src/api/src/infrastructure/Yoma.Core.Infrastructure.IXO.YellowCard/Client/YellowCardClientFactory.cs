using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Payout.Interfaces.Provider;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Client
{
  public sealed class YellowCardClientFactory : IPayoutProviderClientFactory
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

    public IPayoutProviderClient CreateClient()
    {
      return new YellowCardClient(_options);
    }
  }
}
