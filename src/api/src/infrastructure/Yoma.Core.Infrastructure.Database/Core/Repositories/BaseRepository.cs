using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Core.Repositories
{
    public abstract class BaseRepository<TEntity, TKey>
       where TEntity : BaseEntity<TKey>
    {
        #region Class Variables
        protected readonly ApplicationDbContext _context;
        protected readonly DbSet<TEntity> _entitySet;
        #endregion

        #region Constructors
        public BaseRepository(ApplicationDbContext context)
        {
            _context = context;
            _entitySet = context.Set<TEntity>();
        }
        #endregion
    }
}
