namespace Yoma.Core.Domain.EmailProvider.Interfaces
{
  public interface IEmailProviderClientFactory
  {
    IEmailProviderClient CreateClient();
  }
}
