using Yoma.Core.Infrastructure.Jobberman.Context;
using Yoma.Core.Infrastructure.Shared.Entities;
using Yoma.Core.Infrastructure.Shared.Repositories;

namespace Yoma.Core.Infrastructure.Jobberman.Repositories
{
  public abstract class BaseRepository<TEntity, TKey> : BaseRepository<JobbermanDbContext, TEntity, TKey>
    where TEntity : BaseEntity<TKey>
  {
    #region Constructors
    protected BaseRepository(JobbermanDbContext context) : base(context) { }
    #endregion
  }
}
