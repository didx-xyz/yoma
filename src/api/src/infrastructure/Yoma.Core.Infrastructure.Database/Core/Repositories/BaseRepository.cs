using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Shared.Entities;
using Yoma.Core.Infrastructure.Shared.Repositories;

namespace Yoma.Core.Infrastructure.Database.Core.Repositories
{
  public abstract class BaseRepository<TEntity, TKey> : BaseRepository<ApplicationDbContext, TEntity, TKey>
    where TEntity : BaseEntity<TKey>
  {
    #region Constructors
    protected BaseRepository(ApplicationDbContext context) : base(context) { }
    #endregion
  }
}
