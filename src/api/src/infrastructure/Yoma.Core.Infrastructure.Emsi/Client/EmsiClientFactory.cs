using Microsoft.Extensions.Options;
using Yoma.Core.Domain.LaborMarketProvider.Interfaces;
using Yoma.Core.Infrastructure.Emsi.Models;

namespace Yoma.Core.Infrastructure.Emsi.Client
{
  public class EmsiClientFactory : ILaborMarketProviderClientFactory
  {
    #region Class Variables
    private readonly EmsiOptions _options;
    #endregion

    #region Constructor
    public EmsiClientFactory(IOptions<EmsiOptions> options)
    {
      _options = options.Value;
    }
    #endregion

    #region Public Members
    public ILaborMarketProviderClient CreateClient()
    {
      return new EmsiClient(_options);
    }
    #endregion
  }
}
