namespace Yoma.Core.Domain.Treasury.Interfaces
{
  public interface ITreasuryBackgroundService
  {
    Task ProcessFinancialYearRollover();
  }
}
