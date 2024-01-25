using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.SSI.Repositories
{
    public class SSITenantCreationRepository : BaseRepository<Entities.SSITenantCreation, Guid>, IRepository<SSITenantCreation>
    {
        #region Constructor
        public SSITenantCreationRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<SSITenantCreation> Query()
        {
            return _context.SSITenantCreation.Select(entity => new SSITenantCreation
            {
                Id = entity.Id,
                EntityType = entity.EntityType,
                StatusId = entity.StatusId,
                Status = Enum.Parse<TenantCreationStatus>(entity.Status.Name, true),
                UserId = entity.UserId,
                OrganizationId = entity.OrganizationId,
                TenantId = entity.TenantId,
                ErrorReason = entity.ErrorReason,
                RetryCount = entity.RetryCount,
                DateCreated = entity.DateCreated,
                DateModified = entity.DateModified
            });
        }

        public async Task<SSITenantCreation> Create(SSITenantCreation item)
        {
            item.DateCreated = DateTimeOffset.UtcNow;
            item.DateModified = DateTimeOffset.UtcNow;

            var entity = new Entities.SSITenantCreation
            {
                Id = item.Id,
                EntityType = item.EntityType,
                StatusId = item.StatusId,
                UserId = item.UserId,
                OrganizationId = item.OrganizationId,
                TenantId = item.TenantId,
                ErrorReason = item.ErrorReason,
                RetryCount = item.RetryCount,
                DateCreated = item.DateCreated,
                DateModified = item.DateModified
            };

            _context.SSITenantCreation.Add(entity);
            await _context.SaveChangesAsync();

            item.Id = entity.Id;
            return item;
        }

        public async Task<SSITenantCreation> Update(SSITenantCreation item)
        {
            var entity = _context.SSITenantCreation.Where(o => o.Id == item.Id).SingleOrDefault()
               ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.SSITenantCreation)} with id '{item.Id}' does not exist");

            item.DateModified = DateTimeOffset.UtcNow;

            entity.TenantId = item.TenantId;
            entity.StatusId = item.StatusId;
            entity.ErrorReason = item.ErrorReason;
            entity.RetryCount = item.RetryCount;
            entity.DateModified = item.DateModified;

            await _context.SaveChangesAsync();

            return item;
        }

        public Task Delete(SSITenantCreation item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
