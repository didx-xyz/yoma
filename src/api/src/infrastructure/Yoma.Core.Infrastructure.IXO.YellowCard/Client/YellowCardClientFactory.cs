using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Payout.Interfaces.Provider;
using Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Client
{
  public sealed class YellowCardClientFactory : IPayoutProviderClientFactory
  {
    #region Class Variables
    private readonly ILogger<YellowCardClient> _logger;
    private readonly YellowCardOptions _options;
    private readonly IYellowCardAuthService _authService;
    #endregion

    #region Constructor
    public YellowCardClientFactory(
      ILogger<YellowCardClient> logger,
      IOptions<YellowCardOptions> options,
      IYellowCardAuthService authService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _options = (options ?? throw new ArgumentNullException(nameof(options))).Value;
      _authService = authService ?? throw new ArgumentNullException(nameof(authService));
    }
    #endregion

    public IPayoutProviderClient CreateClient()
    {
      return new YellowCardClient(_logger, _options, _authService);
    }
  }
}
