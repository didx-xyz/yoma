using Yoma.Core.Domain.EmailProvider.Models;

namespace Yoma.Core.Domain.EmailProvider.Interfaces
{
  public interface IEmailPreferenceFilterService
  {
    List<EmailRecipient>? FilterRecipients(EmailType type, List<EmailRecipient>? recipients);
  }
}
