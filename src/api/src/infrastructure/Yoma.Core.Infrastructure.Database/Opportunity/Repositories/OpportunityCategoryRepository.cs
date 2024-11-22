using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories
{
  public class OpportunityCategoryRepository : BaseRepository<Entities.OpportunityCategory, Guid>, IRepository<OpportunityCategory>
  {
    #region Constructor
    public OpportunityCategoryRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<OpportunityCategory> Query()
    {
      return _context.OpportunityCategories.Select(entity => new OpportunityCategory
      {
        Id = entity.Id,
        OpportunityId = entity.OpportunityId,
        OpportunityStatusId = entity.Opportunity.Status.Id,
        OpportunityDateStart = entity.Opportunity.DateStart,
        OpporunityHidden = entity.Opportunity.Hidden, 
        OrganizationId = entity.Opportunity.OrganizationId,
        OrganizationStatusId = entity.Opportunity.Organization.Status.Id,
        CategoryId = entity.CategoryId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<OpportunityCategory> Create(OpportunityCategory item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new Entities.OpportunityCategory
      {
        Id = item.Id,
        OpportunityId = item.OpportunityId,
        CategoryId = item.CategoryId,
        DateCreated = item.DateCreated,
      };

      _context.OpportunityCategories.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }
    public Task<OpportunityCategory> Update(OpportunityCategory item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(OpportunityCategory item)
    {
      var entity = _context.OpportunityCategory.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(OpportunityCategory)} with id '{item.Id}' does not exist");
      _context.OpportunityCategory.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
