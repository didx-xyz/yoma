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
                StatusId = entity.StatusId,
                Status = Enum.Parse<TransactionStatus>(entity.Status.Name, true),
                Amount = entity.Amount,
                TransactionId = entity.TransactionId,
                DateCreated = entity.DateCreated,
                DateModified = entity.DateModified
            }); ;
        }

        public async Task<TransactionLog> Create(TransactionLog item)
        {
            item.DateCreated = DateTimeOffset.Now;
            item.DateModified = DateTimeOffset.Now;

            var entity = new Entities.TransactionLog
            {
                Id = item.Id,
                UserId = item.UserId,
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

        public async Task<TransactionLog> Update(TransactionLog item)
        {
            var entity = _context.RewardTransaction.Where(o => o.Id == item.Id).SingleOrDefault()
               ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.TransactionLog)} with id '{item.Id}' does not exist");

            item.DateModified = DateTimeOffset.Now;

            entity.StatusId = item.StatusId;
            entity.DateModified = item.DateModified;

            await _context.SaveChangesAsync();

            return item;
        }

        public Task Delete(TransactionLog item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
