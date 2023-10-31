using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.SSI.Repositories
{
    internal class SSIWalletCreationRepository : BaseRepository<Entities.SSIWalletCreation, Guid>, IRepository<SSIWalletCreation>
    {
        #region Constructor
        public SSIWalletCreationRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<SSIWalletCreation> Query()
        {
            return _context.SSIWalletCreation.Select(entity => new SSIWalletCreation
            {
                Id = entity.Id,
                EntityType = Enum.Parse<EntityType>(entity.EntityType, true),
                StatusId = entity.StatusId,
                Status = Enum.Parse<WalletCreationStatus>(entity.Status.Name, true),
                UserId = entity.UserId,
                OrganizationId = entity.OrganizationId,
                WalletId = entity.WalletId,
                ErrorReason = entity.ErrorReason,
                RetryCount = entity.RetryCount,
                DateCreated = entity.DateCreated,
                DateModified = entity.DateModified
            });
        }

        public async Task<SSIWalletCreation> Create(SSIWalletCreation item)
        {
            item.DateCreated = DateTimeOffset.Now;
            item.DateModified = DateTimeOffset.Now;

            var entity = new Entities.SSIWalletCreation
            {
                Id = item.Id,
                EntityType = item.EntityType.ToString(),
                StatusId = item.StatusId,
                UserId = item.UserId,
                OrganizationId = item.OrganizationId,
                WalletId = item.WalletId,
                ErrorReason = item.ErrorReason,
                RetryCount = item.RetryCount,
                DateCreated = item.DateCreated,
                DateModified = item.DateModified
            };

            _context.SSIWalletCreation.Add(entity);
            await _context.SaveChangesAsync();

            item.Id = entity.Id;
            return item;
        }

        public async Task<SSIWalletCreation> Update(SSIWalletCreation item)
        {
            var entity = _context.SSIWalletCreation.Where(o => o.Id == item.Id).SingleOrDefault()
               ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.SSIWalletCreation)} with id '{item.Id}' does not exist");

            item.DateModified = DateTimeOffset.Now;

            entity.StatusId = item.StatusId;
            entity.ErrorReason = item.ErrorReason;
            entity.RetryCount = item.RetryCount;
            entity.DateModified = item.DateModified;

            await _context.SaveChangesAsync();

            return item;
        }

        public Task Delete(SSIWalletCreation item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
