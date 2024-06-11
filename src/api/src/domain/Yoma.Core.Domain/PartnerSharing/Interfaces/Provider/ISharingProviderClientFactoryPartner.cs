namespace Yoma.Core.Domain.PartnerSharing.Interfaces.Provider
{
  public interface ISharingProviderClientFactoryPartner
  {
    ISharingProviderClient CreateClient(Partner partner);
  }
}
