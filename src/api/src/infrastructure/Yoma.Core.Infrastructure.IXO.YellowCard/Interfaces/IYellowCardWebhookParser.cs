using Yoma.Core.Domain.Payout.Models.Provider;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces
{
  public interface IYellowCardWebhookParser
  {
    PayoutStatusResponse Parse(YellowCardWebhookEvent payload);
  }
}
