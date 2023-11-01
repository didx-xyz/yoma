using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.SSI.Repositories.Lookups
{
    public class SSICredentialIssuanceStatusRepository : BaseRepository<Entities.Lookups.SSICredentialIssuanceStatus, Guid>, IRepository<SSICredentialIssuanceStatus>
    {
        #region Constructor
        public SSICredentialIssuanceStatusRepository(ApplicationDbContext context) : base(context)
        {
        }
        #endregion

        #region Public Members
        public IQueryable<SSICredentialIssuanceStatus> Query()
        {
            return _context.SSICredentialIssuanceStatus.Select(entity => new SSICredentialIssuanceStatus
            {
                Id = entity.Id,
                Name = entity.Name
            });
        }

        public Task<SSICredentialIssuanceStatus> Create(SSICredentialIssuanceStatus item)
        {
            throw new NotImplementedException();
        }

        public Task<SSICredentialIssuanceStatus> Update(SSICredentialIssuanceStatus item)
        {
            throw new NotImplementedException();
        }

        public Task Delete(SSICredentialIssuanceStatus item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
