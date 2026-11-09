using Yoma.Core.Infrastructure.DidxMe.Context;
using Yoma.Core.Infrastructure.Shared.Entities;
using Yoma.Core.Infrastructure.Shared.Repositories;

namespace Yoma.Core.Infrastructure.DidxMe.Repositories
{
  public abstract class BaseRepository<TEntity, TKey> : BaseRepository<ProviderDbContext, TEntity, TKey>
    where TEntity : BaseEntity<TKey>
  {
    #region Constructors
    protected BaseRepository(ProviderDbContext context) : base(context) { }
    #endregion
  }
}
