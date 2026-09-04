using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Payout.Interfaces.Provider;
using Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Client
{
  public sealed class YellowCardClientFactory : IPayoutProviderClientFactory
  {
    #region Class Variables
    private readonly ILogger<YellowCardClient> _logger;
    private readonly AppSettings _appSettings;
    private readonly YellowCardOptions _options;
    private readonly IYellowCardAuthService _authService;
    private readonly IMemoryCache _memoryCache;
    private readonly ICountryService _countryService;
    #endregion

    #region Constructor
    public YellowCardClientFactory(
      ILogger<YellowCardClient> logger,
      IOptions<AppSettings> appSettings,
      IOptions<YellowCardOptions> options,
      IYellowCardAuthService authService,
      IMemoryCache memoryCache,
      ICountryService countryService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _appSettings = (appSettings ?? throw new ArgumentNullException(nameof(appSettings))).Value;
      _options = (options ?? throw new ArgumentNullException(nameof(options))).Value;
      _authService = authService ?? throw new ArgumentNullException(nameof(authService));
      _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
    }
    #endregion

    public IPayoutProviderClient CreateClient()
    {
      return new YellowCardClient(_logger, _appSettings, _options, _authService, _memoryCache, _countryService);
    }
  }
}
