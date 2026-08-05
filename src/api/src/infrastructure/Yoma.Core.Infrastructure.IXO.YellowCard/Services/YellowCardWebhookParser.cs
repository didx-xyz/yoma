using Yoma.Core.Domain.Payout.Models.Provider;
using Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Services
{
  public sealed class YellowCardWebhookParser : IYellowCardWebhookParser
  {
    public PayoutStatusResponse Parse(YellowCardWebhookEvent payload)
    {
      ArgumentNullException.ThrowIfNull(payload, nameof(payload));

      // TODO: Validate and map the IXO / Yellow Card event once its payload and authentication specifications are confirmed.
      // The normalized response must identify Provider.YellowCard; provider identity belongs to this integration,
      // not to the webhook controller or the payout-service caller.
      throw new NotImplementedException("Yellow Card webhook validation has not been implemented");
    }
  }
}
