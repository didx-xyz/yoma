using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.PartnerSharing.Repositories.Lookups
{
  public class PartnerRepository : BaseRepository<Entities.Lookups.Partner, Guid>, IRepository<Partner>
  {
    #region Constructor
    public PartnerRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<Partner> Query()
    {
      return _context.PartnerSharingPartner.Select(entity => new Partner
      {
        Id = entity.Id,
        Name = entity.Name,
        Active = entity.Active,
        ActionEnabled = entity.ActionEnabled
      });
    }

    public Task<Partner> Create(Partner item)
    {
      throw new NotImplementedException();
    }

    public Task<Partner> Update(Partner item)
    {
      throw new NotImplementedException();
    }
    public Task Delete(Partner item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
