namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Interfaces
{
  public interface IOpportunityCatalogueBackgroundService
  {
    Task RefreshCatalogue(bool onStartupInitialRefresh);
  }
}
