using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories
{
  public class OpportunitySkillRepository : BaseRepository<Entities.OpportunitySkill, Guid>, IRepository<OpportunitySkill>
  {
    #region Constructor
    public OpportunitySkillRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<OpportunitySkill> Query()
    {
      return _context.OpportunitySkills.Select(entity => new OpportunitySkill
      {
        Id = entity.Id,
        OpportunityId = entity.OpportunityId,
        SkillId = entity.SkillId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<OpportunitySkill> Create(OpportunitySkill item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new Entities.OpportunitySkill
      {
        Id = item.Id,
        OpportunityId = item.OpportunityId,
        SkillId = item.SkillId,
        DateCreated = item.DateCreated,
      };

      _context.OpportunitySkills.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }
    public Task<OpportunitySkill> Update(OpportunitySkill item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(OpportunitySkill item)
    {
      var entity = _context.OpportunitySkills.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(OpportunitySkill)} with id '{item.Id}' does not exist");
      _context.OpportunitySkills.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
