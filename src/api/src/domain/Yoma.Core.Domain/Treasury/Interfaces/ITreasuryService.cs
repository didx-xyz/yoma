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

    Task CashOutCompleted(Models.Treasury treasury, decimal amount);

    Task<bool> EnsureCurrentFinancialYear(Models.Treasury treasury);

    Task<bool> ProcessFinancialYearRollover();

    Task<decimal> ConvertZltoToUsd(decimal amount);
  }
}
