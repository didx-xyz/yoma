using Yoma.Core.Infrastructure.AriesCloud.Context;
using Yoma.Core.Infrastructure.Shared.Entities;
using Yoma.Core.Infrastructure.Shared.Repositories;

namespace Yoma.Core.Infrastructure.AriesCloud.Repositories
{
  public abstract class BaseRepository<TEntity, TKey> : BaseRepository<AriesCloudDbContext, TEntity, TKey>
    where TEntity : BaseEntity<TKey>
  {
    #region Constructors
    protected BaseRepository(AriesCloudDbContext context) : base(context) { }
    #endregion
  }
}
