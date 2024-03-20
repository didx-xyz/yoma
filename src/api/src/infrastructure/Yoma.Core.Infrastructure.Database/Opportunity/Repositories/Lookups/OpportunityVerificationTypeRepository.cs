using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories.Lookups
{
  public class OpportunityVerificationTypeRepository : BaseRepository<Entities.Lookups.OpportunityVerificationType, Guid>, IRepository<OpportunityVerificationType>
  {
    #region Constructor
    public OpportunityVerificationTypeRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<OpportunityVerificationType> Query()
    {
      return _context.OpportunityVerificationType.Select(entity => new OpportunityVerificationType
      {
        Id = entity.Id,
        Type = Enum.Parse<VerificationType>(entity.Name, true),
        DisplayName = entity.DisplayName,
        Description = entity.Description
      });
    }

    public Task<OpportunityVerificationType> Create(OpportunityVerificationType item)
    {
      throw new NotImplementedException();
    }

    public Task<OpportunityVerificationType> Update(OpportunityVerificationType item)
    {
      throw new NotImplementedException();
    }
    public Task Delete(OpportunityVerificationType item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
