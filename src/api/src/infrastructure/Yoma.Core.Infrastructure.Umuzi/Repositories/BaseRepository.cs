using Yoma.Core.Infrastructure.Shared.Entities;
using Yoma.Core.Infrastructure.Shared.Repositories;
using Yoma.Core.Infrastructure.Umuzi.Context;

namespace Yoma.Core.Infrastructure.Umuzi.Repositories
{
  public abstract class BaseRepository<TEntity, TKey> : BaseRepository<UmuziDbContext, TEntity, TKey>
    where TEntity : BaseEntity<TKey>
  {
    #region Constructor
    protected BaseRepository(UmuziDbContext context) : base(context) { }
    #endregion
  }
}
