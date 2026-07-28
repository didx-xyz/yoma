using Yoma.Core.Infrastructure.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.YellowCard.Models;

namespace Yoma.Core.Infrastructure.YellowCard.Services
{
  public sealed class YellowCardWebhookParser : IYellowCardWebhookParser
  {
    public void Validate(YellowCardWebhookEvent payload)
    {
      ArgumentNullException.ThrowIfNull(payload, nameof(payload));

      // TODO: Validate the IXO / Yellow Card event once its payload and authentication specifications are confirmed.
      throw new NotImplementedException("Yellow Card webhook validation has not been implemented");
    }
  }
}
