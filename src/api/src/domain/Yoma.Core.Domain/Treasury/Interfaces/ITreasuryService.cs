using Yoma.Core.Domain.Treasury.Models;

namespace Yoma.Core.Domain.Treasury.Interfaces
{
  public interface ITreasuryService
  {
    TreasuryInfo Get();

    Task<TreasuryInfo> Update(TreasuryRequestUpdate request);

    Task ZltoRewardAwarded(decimal amount);

    Task ChimoneyCashedOut(decimal amount);
  }
}
