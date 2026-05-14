using Yoma.Core.Infrastructure.Alison.Context;
using Yoma.Core.Infrastructure.Shared.Entities;
using Yoma.Core.Infrastructure.Shared.Repositories;

namespace Yoma.Core.Infrastructure.Alison.Repositories
{
  public abstract class BaseRepository<TEntity, TKey> : BaseRepository<AlisonDbContext, TEntity, TKey>
    where TEntity : BaseEntity<TKey>
  {
    #region Constructors
    protected BaseRepository(AlisonDbContext context) : base(context) { }
    #endregion
  }
}
