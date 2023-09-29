using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories.Lookups
{
    public class OrganizationStatusRepository : BaseRepository<Entities.Lookups.OrganizationStatus, Guid>, IRepository<OrganizationStatus>
    {
        #region Constructor
        public OrganizationStatusRepository(ApplicationDbContext context) : base(context)
        {
        }
        #endregion

        #region Public Members
        public IQueryable<OrganizationStatus> Query()
        {
            return _context.OrganizationStatus.Select(entity => new OrganizationStatus
            {
                Id = entity.Id,
                Name = entity.Name
            });
        }

        public Task<OrganizationStatus> Create(OrganizationStatus item)
        {
            throw new NotImplementedException();
        }

        public Task<OrganizationStatus> Update(OrganizationStatus item)
        {
            throw new NotImplementedException();
        }

        public Task Delete(OrganizationStatus item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
