using Yoma.Core.Domain.SSI.Interfaces.Provider;

namespace Yoma.Core.Infrastructure.DidxMe.Client
{
  public class ProviderClientFactory : ISSIProviderClientFactory
  {
    #region Class Variables
    private readonly ISSIProviderClient _client;
    #endregion

    #region Constructor
    public ProviderClientFactory(ISSIProviderClient client)
    {
      _client = client ?? throw new ArgumentNullException(nameof(client));
    }
    #endregion

    #region Public Members
    public ISSIProviderClient CreateClient() => _client;
    #endregion
  }
}
