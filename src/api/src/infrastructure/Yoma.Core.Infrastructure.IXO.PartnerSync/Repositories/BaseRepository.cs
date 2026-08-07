using Yoma.Core.Infrastructure.IXO.PartnerSync.Context;
using Yoma.Core.Infrastructure.Shared.Entities;
using Yoma.Core.Infrastructure.Shared.Repositories;

namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Repositories
{
  public abstract class BaseRepository<TEntity, TKey> : BaseRepository<IXOPartnerSyncDbContext, TEntity, TKey>
    where TEntity : BaseEntity<TKey>
  {
    #region Constructor
    protected BaseRepository(IXOPartnerSyncDbContext context) : base(context) { }
    #endregion
  }
}
