using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.AriesCloud.Context;

namespace Yoma.Core.Infrastructure.AriesCloud.Repositories
{
    public abstract class BaseRepository<TEntity>
        where TEntity : class
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
