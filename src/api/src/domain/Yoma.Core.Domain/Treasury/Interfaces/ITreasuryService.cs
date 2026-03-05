using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Treasury.Models;

namespace Yoma.Core.Domain.Treasury.Interfaces
{
  public interface ITreasuryService
  {
    TreasuryInfo Get();

    Models.Treasury Get(LockMode? lockMode = null);

    Task<TreasuryInfo> Update(TreasuryRequestUpdate request);

    Task ZltoRewardAwarded(Models.Treasury treasury, decimal? amount);

    Task ChimoneyCashedOut(Models.Treasury treasury, decimal amount);
  }
}
