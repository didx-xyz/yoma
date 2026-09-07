namespace Yoma.Core.Infrastructure.Umuzi.Interfaces
{
  public interface IOpportunityCatalogueBackgroundService
  {
    Task RefreshCatalogue(bool onStartupInitialRefresh);
  }
}
