using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Marketplace;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Marketplace.Repositories
{
  public class TransactionLogRepository : BaseRepository<Entities.TransactionLog, Guid>, IRepository<TransactionLog>
  {
    #region Constructor
    public TransactionLogRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<TransactionLog> Query()
    {
      return _context.TransactionLog.Select(entity => new TransactionLog
      {
        Id = entity.Id,
        UserId = entity.UserId,
        ItemCategoryId = entity.ItemCategoryId,
        ItemId = entity.ItemId,
        StatusId = entity.StatusId,
        Status = Enum.Parse<TransactionStatus>(entity.Status.Name, true),
        Amount = entity.Amount,
        TransactionId = entity.TransactionId,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<TransactionLog> Create(TransactionLog item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.TransactionLog
      {
        UserId = item.UserId,
        ItemCategoryId = item.ItemCategoryId,
        ItemId = item.ItemId,
        StatusId = item.StatusId,
        TransactionId = item.TransactionId,
        Amount = item.Amount,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.TransactionLog.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<TransactionLog> Update(TransactionLog item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(TransactionLog item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
