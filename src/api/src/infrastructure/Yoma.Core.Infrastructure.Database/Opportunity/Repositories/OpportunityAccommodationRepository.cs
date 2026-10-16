using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories
{
  public class OpportunityAccommodationRepository : BaseRepository<Entities.OpportunityAccommodation, Guid>, IRepository<OpportunityAccommodation>
  {
    #region Constructor
    public OpportunityAccommodationRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<OpportunityAccommodation> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<OpportunityAccommodation> Query()
    {
      return _context.OpportunityAccommodations.Select(entity => new OpportunityAccommodation
      {
        Id = entity.Id,
        OpportunityId = entity.OpportunityId,
        OpportunityStatusId = entity.Opportunity.Status.Id,
        OpportunityDateStart = entity.Opportunity.DateStart,
        OpportunityDateEnd = entity.Opportunity.DateEnd,
        OpporunityHidden = entity.Opportunity.Hidden,
        OrganizationId = entity.Opportunity.OrganizationId,
        OrganizationStatusId = entity.Opportunity.Organization.Status.Id,
        AccommodationId = entity.AccommodationId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<OpportunityAccommodation> Create(OpportunityAccommodation item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new Entities.OpportunityAccommodation
      {
        Id = item.Id,
        OpportunityId = item.OpportunityId,
        AccommodationId = item.AccommodationId,
        DateCreated = item.DateCreated,
      };

      _context.OpportunityAccommodations.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<OpportunityAccommodation> Update(OpportunityAccommodation item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(OpportunityAccommodation item)
    {
      var entity = _context.OpportunityAccommodations
        .Where(o => o.Id == item.Id)
        .SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(OpportunityAccommodation)} with id '{item.Id}' does not exist");

      _context.OpportunityAccommodations.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
