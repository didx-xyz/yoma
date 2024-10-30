namespace Yoma.Core.Domain.Notification.Interfaces
{
  public interface IMessageProviderClientFactory
  {
    IMessageProviderClient CreateClient();
  }
}
