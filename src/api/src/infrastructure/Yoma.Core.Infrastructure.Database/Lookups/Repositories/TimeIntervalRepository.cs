using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Lookups.Repositories
{
    public class TimeIntervalRepository : BaseRepository<TimeInterval, Guid>, IRepository<Domain.Lookups.Models.TimeInterval>
    {
        #region Constructor
        public TimeIntervalRepository(ApplicationDbContext context) : base(context)
        {
        }
        #endregion

        #region Public Members
        public IQueryable<Domain.Lookups.Models.TimeInterval> Query()
        {
            return _context.TimeInterval.Select(entity => new Domain.Lookups.Models.TimeInterval
            {
                Id = entity.Id,
                Name = entity.Name
            });
        }

        public Task<Domain.Lookups.Models.TimeInterval> Create(Domain.Lookups.Models.TimeInterval item)
        {
            throw new NotImplementedException();
        }

        public Task<Domain.Lookups.Models.TimeInterval> Update(Domain.Lookups.Models.TimeInterval item)
        {
            throw new NotImplementedException();
        }

        public Task Delete(Domain.Lookups.Models.TimeInterval item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
