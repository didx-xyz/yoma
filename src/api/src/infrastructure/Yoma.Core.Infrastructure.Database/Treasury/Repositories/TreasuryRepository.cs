using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Treasury.Repositories
{
  public sealed class TreasuryRepository : BaseRepository<Entities.Treasury, Guid>, IRepository<Domain.Treasury.Models.Treasury>
  {
    #region Constructor
    public TreasuryRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Treasury.Models.Treasury> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Treasury.Models.Treasury> Query()
    {
      return _context.Treasury.Select(entity => new Domain.Treasury.Models.Treasury
      {
        Id = entity.Id,
        FinancialYearStartMonth = entity.FinancialYearStartMonth,
        FinancialYearStartDay = entity.FinancialYearStartDay,
        FinancialYearStartDate = entity.FinancialYearStartDate,
        ZltoRewardPoolCurrentFinancialYear = entity.ZltoRewardPoolCurrentFinancialYear,
        ZltoRewardCumulative = entity.ZltoRewardCumulative,
        ZltoRewardCumulativeCurrentFinancialYear = entity.ZltoRewardCumulativeCurrentFinancialYear,
        CashOutPoolCurrentFinancialYearInUsd = entity.CashOutPoolCurrentFinancialYearInUsd,
        CashOutCumulativeInUsd = entity.CashOutCumulativeInUsd,
        CashOutCumulativeCurrentFinancialYearInUsd = entity.CashOutCumulativeCurrentFinancialYearInUsd,
        ConversionRateZltoUsd = entity.ConversionRateZltoUsd,
        CreatedByUserId = entity.CreatedByUserId,
        DateCreated = entity.DateCreated,
        ModifiedByUserId = entity.ModifiedByUserId,
        DateModified = entity.DateModified
      });
    }

    public async Task<Domain.Treasury.Models.Treasury> Create(Domain.Treasury.Models.Treasury item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.Treasury
      {
        Id = item.Id,
        FinancialYearStartMonth = item.FinancialYearStartMonth,
        FinancialYearStartDay = item.FinancialYearStartDay,
        FinancialYearStartDate = item.FinancialYearStartDate,
        ZltoRewardPoolCurrentFinancialYear = item.ZltoRewardPoolCurrentFinancialYear,
        ZltoRewardCumulative = item.ZltoRewardCumulative,
        ZltoRewardCumulativeCurrentFinancialYear = item.ZltoRewardCumulativeCurrentFinancialYear,
        CashOutPoolCurrentFinancialYearInUsd = item.CashOutPoolCurrentFinancialYearInUsd,
        CashOutCumulativeInUsd = item.CashOutCumulativeInUsd,
        CashOutCumulativeCurrentFinancialYearInUsd = item.CashOutCumulativeCurrentFinancialYearInUsd,
        ConversionRateZltoUsd = item.ConversionRateZltoUsd,
        DateCreated = item.DateCreated,
        CreatedByUserId = item.CreatedByUserId,
        DateModified = item.DateModified,
        ModifiedByUserId = item.ModifiedByUserId
      };

      _context.Treasury.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<Domain.Treasury.Models.Treasury> Update(Domain.Treasury.Models.Treasury item)
    {
      var entity = _context.Treasury.Where(o => o.Id == item.Id).SingleOrDefault()
       ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.Treasury)} with id '{item.Id}' does not exist");

      // Treasury audit fields track admin configuration changes only. Cumulative increments and automatic
      // financial-year rollover must preserve the last admin and configuration-modified timestamp.
      var configurationModified =
        entity.FinancialYearStartMonth != item.FinancialYearStartMonth ||
        entity.FinancialYearStartDay != item.FinancialYearStartDay ||
        entity.ZltoRewardPoolCurrentFinancialYear != item.ZltoRewardPoolCurrentFinancialYear ||
        entity.CashOutPoolCurrentFinancialYearInUsd != item.CashOutPoolCurrentFinancialYearInUsd ||
        entity.ConversionRateZltoUsd != item.ConversionRateZltoUsd;

      if (configurationModified)
      {
        item.DateModified = DateTimeOffset.UtcNow;
        entity.DateModified = item.DateModified;
        entity.ModifiedByUserId = item.ModifiedByUserId;
      }
      else
      {
        item.DateModified = entity.DateModified;
        item.ModifiedByUserId = entity.ModifiedByUserId;
      }

      entity.FinancialYearStartMonth = item.FinancialYearStartMonth;
      entity.FinancialYearStartDay = item.FinancialYearStartDay;
      entity.FinancialYearStartDate = item.FinancialYearStartDate;
      entity.ZltoRewardPoolCurrentFinancialYear = item.ZltoRewardPoolCurrentFinancialYear;
      entity.ZltoRewardCumulative = item.ZltoRewardCumulative;
      entity.ZltoRewardCumulativeCurrentFinancialYear = item.ZltoRewardCumulativeCurrentFinancialYear;
      entity.CashOutPoolCurrentFinancialYearInUsd = item.CashOutPoolCurrentFinancialYearInUsd;
      entity.CashOutCumulativeInUsd = item.CashOutCumulativeInUsd;
      entity.CashOutCumulativeCurrentFinancialYearInUsd = item.CashOutCumulativeCurrentFinancialYearInUsd;
      entity.ConversionRateZltoUsd = item.ConversionRateZltoUsd;
      await _context.SaveChangesAsync();

      return item;
    }

    public Task Delete(Domain.Treasury.Models.Treasury item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
