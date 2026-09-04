using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Payout.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Payout.Repositories.Lookup
{
  public sealed class PayoutTransactionStatusRepository : BaseRepository<Entities.Lookups.PayoutTransactionStatus, Guid>, IRepository<PayoutTransactionStatus>
  {
    #region Constructor
    public PayoutTransactionStatusRepository(ApplicationDbContext context)
      : base(context ?? throw new ArgumentNullException(nameof(context))) { }
    #endregion

    #region Public Members
    public IQueryable<PayoutTransactionStatus> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<PayoutTransactionStatus> Query()
    {
      return _context.PayoutTransactionStatus.Select(entity => new PayoutTransactionStatus
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<PayoutTransactionStatus> Create(PayoutTransactionStatus item)
    {
      throw new NotImplementedException();
    }

    public Task<PayoutTransactionStatus> Update(PayoutTransactionStatus item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(PayoutTransactionStatus item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
