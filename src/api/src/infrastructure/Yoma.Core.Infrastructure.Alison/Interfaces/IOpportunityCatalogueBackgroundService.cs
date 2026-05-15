namespace Yoma.Core.Infrastructure.Alison.Interfaces
{
  public interface IOpportunityCatalogueBackgroundService
  {
    Task RefreshCatalogue(bool onStartupInitialRefresh);
  }
}
