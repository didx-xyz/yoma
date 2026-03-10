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
        ChimoneyPoolCurrentFinancialYearInUSD = entity.ChimoneyPoolCurrentFinancialYearInUSD,
        ChimoneyCumulativeInUSD = entity.ChimoneyCumulativeInUSD,
        ChimoneyCumulativeCurrentFinancialYearInUSD = entity.ChimoneyCumulativeCurrentFinancialYearInUSD,
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
        ChimoneyPoolCurrentFinancialYearInUSD = item.ChimoneyPoolCurrentFinancialYearInUSD,
        ChimoneyCumulativeInUSD = item.ChimoneyCumulativeInUSD,
        ChimoneyCumulativeCurrentFinancialYearInUSD = item.ChimoneyCumulativeCurrentFinancialYearInUSD,
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

      item.DateModified = DateTimeOffset.UtcNow;

      entity.FinancialYearStartMonth = item.FinancialYearStartMonth;
      entity.FinancialYearStartDay = item.FinancialYearStartDay;
      entity.FinancialYearStartDate = item.FinancialYearStartDate;
      entity.ZltoRewardPoolCurrentFinancialYear = item.ZltoRewardPoolCurrentFinancialYear;
      entity.ChimoneyPoolCurrentFinancialYearInUSD = item.ChimoneyPoolCurrentFinancialYearInUSD;
      entity.ConversionRateZltoUsd = item.ConversionRateZltoUsd;
      entity.DateModified = item.DateModified;
      entity.ModifiedByUserId = item.ModifiedByUserId;

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
