using Yoma.Core.Infrastructure.Shared.Entities;
using Yoma.Core.Infrastructure.Shared.Repositories;
using Yoma.Core.Infrastructure.Substack.Context;

namespace Yoma.Core.Infrastructure.Substack.Repositories
{
  public abstract class BaseRepository<TEntity, TKey> : BaseRepository<SubstackDbContext, TEntity, TKey>
    where TEntity : BaseEntity<TKey>
  {
    #region Constructors
    protected BaseRepository(SubstackDbContext context) : base(context) { }
    #endregion
  }
}
