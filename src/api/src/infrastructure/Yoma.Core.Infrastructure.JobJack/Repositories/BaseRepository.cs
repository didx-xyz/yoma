using Yoma.Core.Infrastructure.JobJack.Context;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.JobJack.Repositories
{
  public abstract class BaseRepository<TEntity, TKey> : Shared.Repositories.BaseRepository<JobJackDbContext, TEntity, TKey>
    where TEntity : BaseEntity<TKey>
  {
    #region Constructors
    protected BaseRepository(JobJackDbContext context) : base(context) { }
    #endregion
  }
}
