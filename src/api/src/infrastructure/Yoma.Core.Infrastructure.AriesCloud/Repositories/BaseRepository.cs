using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.AriesCloud.Context;
using Yoma.Core.Infrastructure.AriesCloud.Entities;

namespace Yoma.Core.Infrastructure.AriesCloud.Repositories
{
    public abstract class BaseRepository<TEntity, TKey>
        where TEntity : BaseEntity<TKey>
    {
        #region Class Variables
        protected readonly AriesCloudDbContext _context;
        protected readonly DbSet<TEntity> _entitySet;
        #endregion

        #region Constructors
        public BaseRepository(AriesCloudDbContext context)
        {
            _context = context;
            _entitySet = context.Set<TEntity>();
        }
        #endregion
    }
}
