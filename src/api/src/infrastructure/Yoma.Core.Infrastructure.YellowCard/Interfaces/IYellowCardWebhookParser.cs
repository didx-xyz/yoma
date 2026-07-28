using Yoma.Core.Infrastructure.YellowCard.Models;

namespace Yoma.Core.Infrastructure.YellowCard.Interfaces
{
  public interface IYellowCardWebhookParser
  {
    void Validate(YellowCardWebhookEvent payload);
  }
}
