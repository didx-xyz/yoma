using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Payout;
using Yoma.Core.Domain.Payout.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Payout.Repositories
{
  public sealed class PayoutTransactionRepository : BaseRepository<Entities.PayoutTransaction, Guid>, IRepository<PayoutTransaction>
  {
    #region Constructor
    public PayoutTransactionRepository(ApplicationDbContext context)
      : base(context ?? throw new ArgumentNullException(nameof(context))) { }
    #endregion

    #region Public Members
    public IQueryable<PayoutTransaction> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<PayoutTransaction> Query()
    {
      return _context.PayoutTransaction.Select(entity => new PayoutTransaction
      {
        Id = entity.Id,
        UserId = entity.UserId,
        Type = entity.Type,
        Provider = entity.Provider,
        StatusId = entity.StatusId,
        Status = Enum.Parse<PayoutTransactionStatus>(entity.Status.Name, true),

        Amount = entity.Amount,
        Currency = entity.Currency,
        TransactionId = entity.TransactionId,
        ErrorReason = entity.ErrorReason,
        ExpiresAt = entity.ExpiresAt,
        RewardReservationExpiresAt = entity.RewardReservationExpiresAt,
        DateLastReconciled = entity.DateLastReconciled,
        RetryCount = entity.RetryCount,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<PayoutTransaction> Create(PayoutTransaction item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = item.DateCreated;

      var entity = new Entities.PayoutTransaction
      {
        Id = item.Id,
        UserId = item.UserId,
        Type = item.Type,
        Provider = item.Provider,
        StatusId = item.StatusId,

        Amount = item.Amount,
        Currency = item.Currency,
        TransactionId = item.TransactionId,
        ErrorReason = item.ErrorReason,
        ExpiresAt = item.ExpiresAt,
        RewardReservationExpiresAt = item.RewardReservationExpiresAt,
        DateLastReconciled = item.DateLastReconciled,
        RetryCount = item.RetryCount,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.PayoutTransaction.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<PayoutTransaction> Update(PayoutTransaction item)
    {
      var entity = _context.PayoutTransaction.SingleOrDefault(o => o.Id == item.Id)
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.PayoutTransaction)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.StatusId = item.StatusId;
      entity.TransactionId = item.TransactionId;
      entity.ErrorReason = item.ErrorReason;
      entity.ExpiresAt = item.ExpiresAt;
      entity.RewardReservationExpiresAt = item.RewardReservationExpiresAt;
      entity.DateLastReconciled = item.DateLastReconciled;
      entity.RetryCount = item.RetryCount;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public Task Delete(PayoutTransaction item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
