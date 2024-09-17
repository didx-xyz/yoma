using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Marketplace.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Marketplace.Repositories.Lookup
{
  public class StoreAccessControlRuleStatusRepository : BaseRepository<Entities.Lookups.StoreAccessControlRuleStatus, Guid>, IRepository<StoreAccessControlRuleStatus>
  {
    #region Constructor
    public StoreAccessControlRuleStatusRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<StoreAccessControlRuleStatus> Query()
    {
      return _context.StoreAccessControlRuleStatus.Select(entity => new StoreAccessControlRuleStatus
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<StoreAccessControlRuleStatus> Create(StoreAccessControlRuleStatus item)
    {
      throw new NotImplementedException();
    }

    public Task<StoreAccessControlRuleStatus> Update(StoreAccessControlRuleStatus item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(StoreAccessControlRuleStatus item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
