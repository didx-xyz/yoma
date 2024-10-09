namespace Yoma.Core.Domain.Notification.Interfaces
{
  public interface IEmailProviderClientFactory
  {
    IEmailProviderClient CreateClient();
  }
}
