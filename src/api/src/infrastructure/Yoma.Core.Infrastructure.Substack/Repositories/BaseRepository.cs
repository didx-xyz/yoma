using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.Shared.Entities;
using Yoma.Core.Infrastructure.Substack.Context;

namespace Yoma.Core.Infrastructure.Substack.Repositories
{
  public abstract class BaseRepository<TEntity, TKey>
        where TEntity : BaseEntity<TKey>
  {
    #region Class Variables
    protected readonly SubstackDbContext _context;
    protected readonly DbSet<TEntity> _entitySet;
    #endregion

    #region Constructors
    public BaseRepository(SubstackDbContext context)
    {
      _context = context;
      _entitySet = context.Set<TEntity>();
    }
    #endregion
  }
}
