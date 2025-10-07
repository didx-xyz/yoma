using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Shared.Repositories
{
  public abstract class BaseRepository<TContext, TEntity, TKey>
    where TEntity : BaseEntity<TKey>
    where TContext : DbContext
  {
    #region Class Variables
    protected readonly TContext _context;
    protected readonly DbSet<TEntity> _entitySet;
    #endregion

    #region Constructors
    public BaseRepository(TContext context)
    {
      _context = context;
      _entitySet = context.Set<TEntity>();
    }
    #endregion
  }
}
