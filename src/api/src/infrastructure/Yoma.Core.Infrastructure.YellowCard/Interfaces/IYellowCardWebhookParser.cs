using Yoma.Core.Domain.Payout.Models.Provider;
using Yoma.Core.Infrastructure.YellowCard.Models;

namespace Yoma.Core.Infrastructure.YellowCard.Interfaces
{
  public interface IYellowCardWebhookParser
  {
    PayoutStatusResponse Parse(YellowCardWebhookEvent payload);
  }
}
