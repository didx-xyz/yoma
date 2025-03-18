using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Reward;
using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Reward.Repositories
{
  public class RewardTransactionRepository : BaseRepository<Entities.RewardTransaction, Guid>, IRepositoryBatched<RewardTransaction>
  {
    #region Constructor
    public RewardTransactionRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<RewardTransaction> Query()
    {
      return _context.RewardTransaction.Select(entity => new RewardTransaction
      {
        Id = entity.Id,
        UserId = entity.UserId,
        StatusId = entity.StatusId,
        Status = Enum.Parse<RewardTransactionStatus>(entity.Status.Name, true),
        SourceEntityType = entity.SourceEntityType,
        MyOpportunityId = entity.MyOpportunityId,
        Amount = entity.Amount,
        TransactionId = entity.TransactionId,
        ErrorReason = entity.ErrorReason,
        RetryCount = entity.RetryCount,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      }); ;
    }

    public async Task<RewardTransaction> Create(RewardTransaction item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.RewardTransaction
      {
        Id = item.Id,
        UserId = item.UserId,
        StatusId = item.StatusId,
        SourceEntityType = item.SourceEntityType,
        MyOpportunityId = item.MyOpportunityId,
        TransactionId = item.TransactionId,
        Amount = item.Amount,
        ErrorReason = item.ErrorReason,
        RetryCount = item.RetryCount,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.RewardTransaction.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<List<RewardTransaction>> Create(List<RewardTransaction> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var entities = items.Select(item =>
         new Entities.RewardTransaction
         {
           Id = item.Id,
           UserId = item.UserId,
           StatusId = item.StatusId,
           SourceEntityType = item.SourceEntityType,
           MyOpportunityId = item.MyOpportunityId,
           TransactionId = item.TransactionId,
           Amount = item.Amount,
           ErrorReason = item.ErrorReason,
           RetryCount = item.RetryCount,
           DateCreated = DateTimeOffset.UtcNow,
           DateModified = DateTimeOffset.UtcNow
         });

      _context.RewardTransaction.AddRange(entities);
      await _context.SaveChangesAsync();

      items = [.. items.Zip(entities, (item, entity) =>
      {
        item.Id = entity.Id;
        item.DateCreated = entity.DateCreated;
        item.DateModified = entity.DateModified;
        return item;
      })];

      return items;
    }

    public async Task<RewardTransaction> Update(RewardTransaction item)
    {
      var entity = _context.RewardTransaction.Where(o => o.Id == item.Id).SingleOrDefault()
         ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.RewardTransaction)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.TransactionId = item.TransactionId;
      entity.StatusId = item.StatusId;
      entity.ErrorReason = item.ErrorReason;
      entity.RetryCount = item.RetryCount;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<List<RewardTransaction>> Update(List<RewardTransaction> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var itemIds = items.Select(o => o.Id).ToList();
      var entities = _context.RewardTransaction.Where(o => itemIds.Contains(o.Id));

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(Entities.RewardTransaction)} with id '{item.Id}' does not exist");

        item.DateModified = DateTimeOffset.UtcNow;

        entity.TransactionId = item.TransactionId;
        entity.StatusId = item.StatusId;
        entity.ErrorReason = item.ErrorReason;
        entity.RetryCount = item.RetryCount;
        entity.DateModified = item.DateModified;
      }

      _context.RewardTransaction.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }

    public Task Delete(RewardTransaction item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
