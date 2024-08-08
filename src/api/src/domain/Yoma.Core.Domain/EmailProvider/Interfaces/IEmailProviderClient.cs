using Yoma.Core.Domain.EmailProvider.Models;

namespace Yoma.Core.Domain.EmailProvider.Interfaces
{
  public interface IEmailProviderClient
  {
    Task Send<T>(EmailType type, List<EmailRecipient> recipients, T data)
      where T : EmailBase;

    Task Send<T>(EmailType type, List<(List<EmailRecipient> Recipients, T Data)> recipientDataGroups)
      where T : EmailBase;
  }
}
