using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories
{
  public class OpportunityVerificationTypeRepository : BaseRepository<Entities.OpportunityVerificationType, Guid>, IRepository<OpportunityVerificationType>
  {
    #region Constructor
    public OpportunityVerificationTypeRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<OpportunityVerificationType> Query()
    {
      return _context.OpportunityVerificationTypes.Select(entity => new OpportunityVerificationType
      {
        Id = entity.Id,
        OpportunityId = entity.OpportunityId,
        VerificationTypeId = entity.VerificationTypeId,
        Description = entity.Description,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<OpportunityVerificationType> Create(OpportunityVerificationType item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.OpportunityVerificationType
      {
        Id = item.Id,
        OpportunityId = item.OpportunityId,
        VerificationTypeId = item.VerificationTypeId,
        Description = item.Description,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.OpportunityVerificationTypes.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }
    public async Task<OpportunityVerificationType> Update(OpportunityVerificationType item)
    {
      var entity = _context.OpportunityVerificationTypes.Where(o => o.Id == item.Id).SingleOrDefault()
         ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.OpportunityVerificationType)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.Description = item.Description;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task Delete(OpportunityVerificationType item)
    {
      var entity = _context.OpportunityVerificationTypes.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(OpportunityVerificationType)} with id '{item.Id}' does not exist");
      _context.OpportunityVerificationTypes.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
