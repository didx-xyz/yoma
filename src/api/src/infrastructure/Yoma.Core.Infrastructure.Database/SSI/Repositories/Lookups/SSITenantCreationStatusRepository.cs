using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.SSI.Repositories.Lookups
{
    public class SSITenantCreationStatusRepository : BaseRepository<Entities.Lookups.SSITenantCreationStatus, Guid>, IRepository<SSITenantCreationStatus>
    {
        #region Constructor
        public SSITenantCreationStatusRepository(ApplicationDbContext context) : base(context)
        {
        }
        #endregion

        #region Public Members
        public IQueryable<SSITenantCreationStatus> Query()
        {
            return _context.SSITenantCreationStatus.Select(entity => new SSITenantCreationStatus
            {
                Id = entity.Id,
                Name = entity.Name
            });
        }

        public Task<SSITenantCreationStatus> Create(SSITenantCreationStatus item)
        {
            throw new NotImplementedException();
        }

        public Task<SSITenantCreationStatus> Update(SSITenantCreationStatus item)
        {
            throw new NotImplementedException();
        }

        public Task Delete(SSITenantCreationStatus item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}

