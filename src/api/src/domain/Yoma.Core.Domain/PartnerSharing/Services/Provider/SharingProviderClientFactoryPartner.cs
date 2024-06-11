using Yoma.Core.Domain.PartnerSharing.Interfaces.Provider;

namespace Yoma.Core.Domain.PartnerSharing.Services.Provider
{
  public class SharingProviderClientFactoryPartner : ISharingProviderClientFactoryPartner
  {
    #region Class Variables
    private readonly IDictionary<Partner, ISharingProviderClientFactory> _factories;
    #endregion

    #region Constructor
    public SharingProviderClientFactoryPartner(IDictionary<Partner, ISharingProviderClientFactory> factories)
    {
      _factories = factories;
    }
    #endregion

    #region Public Members
    public ISharingProviderClient CreateClient(Partner partner)
    {
      if (_factories.TryGetValue(partner, out var factory)) return factory.CreateClient();

      throw new InvalidOperationException($"Factory not registered for sharing partner {partner}");
    }
    #endregion
  }
}
