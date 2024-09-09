using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Marketplace.Repositories
{
  public class StoreAccessControlRuleOpportunityRepository : BaseRepository<Entities.StoreAccessControlRuleOpportunity, Guid>, IRepository<StoreAccessControlRuleOpportunity>
  {
    #region Constructor
    public StoreAccessControlRuleOpportunityRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<StoreAccessControlRuleOpportunity> Query()
    {
      return _context.StoreAccessControlRuleOpportunities.Select(entity => new StoreAccessControlRuleOpportunity
      {
        Id = entity.Id,
        StoreAccessControlRuleId = entity.StoreAccessControlRuleId,
        OpportunityId = entity.OpportunityId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<StoreAccessControlRuleOpportunity> Create(StoreAccessControlRuleOpportunity item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new Entities.StoreAccessControlRuleOpportunity
      {
        Id = item.Id,
        StoreAccessControlRuleId = item.StoreAccessControlRuleId,
        OpportunityId = item.OpportunityId,
        DateCreated = item.DateCreated,
      };

      _context.StoreAccessControlRuleOpportunities.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<StoreAccessControlRuleOpportunity> Update(StoreAccessControlRuleOpportunity item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(StoreAccessControlRuleOpportunity item)
    {
      var entity = _context.StoreAccessControlRuleOpportunities.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(StoreAccessControlRuleOpportunity)} with id '{item.Id}' does not exist");
      _context.StoreAccessControlRuleOpportunities.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
