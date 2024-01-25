using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Reward;
using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Reward.Repositories
{
    public class WalletCreationRepository : BaseRepository<Entities.WalletCreation, Guid>, IRepository<WalletCreation>
    {
        #region Constructor
        public WalletCreationRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<WalletCreation> Query()
        {
            return _context.WalletCreation.Select(entity => new WalletCreation
            {
                Id = entity.Id,
                StatusId = entity.StatusId,
                Status = Enum.Parse<WalletCreationStatus>(entity.Status.Name, true),
                UserId = entity.UserId,
                WalletId = entity.WalletId,
                Balance = entity.Balance,
                ErrorReason = entity.ErrorReason,
                RetryCount = entity.RetryCount,
                DateCreated = entity.DateCreated,
                DateModified = entity.DateModified
            });
        }

        public async Task<WalletCreation> Create(WalletCreation item)
        {
            item.DateCreated = DateTimeOffset.UtcNow;
            item.DateModified = DateTimeOffset.UtcNow;

            var entity = new Entities.WalletCreation
            {
                Id = item.Id,
                StatusId = item.StatusId,
                UserId = item.UserId,
                WalletId = item.WalletId,
                Balance = item.Balance,
                ErrorReason = item.ErrorReason,
                RetryCount = item.RetryCount,
                DateCreated = item.DateCreated,
                DateModified = item.DateModified
            };

            _context.WalletCreation.Add(entity);
            await _context.SaveChangesAsync();

            item.Id = entity.Id;
            return item;
        }

        public async Task<WalletCreation> Update(WalletCreation item)
        {
            var entity = _context.WalletCreation.Where(o => o.Id == item.Id).SingleOrDefault()
           ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.WalletCreation)} with id '{item.Id}' does not exist");

            item.DateModified = DateTimeOffset.UtcNow;

            entity.WalletId = item.WalletId;
            entity.Balance = item.Balance;
            entity.StatusId = item.StatusId;
            entity.ErrorReason = item.ErrorReason;
            entity.RetryCount = item.RetryCount;
            entity.DateModified = item.DateModified;

            await _context.SaveChangesAsync();

            return item;
        }

        public Task Delete(WalletCreation item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
