using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories.Lookups
{
  public class OrganizationProviderTypeRepository : BaseRepository<Entities.Lookups.OrganizationProviderType, Guid>, IRepository<OrganizationProviderType>
  {
    #region Constructor
    public OrganizationProviderTypeRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<OrganizationProviderType> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<OrganizationProviderType> Query()
    {
      return _context.OrganizationProviderType.Select(entity => new OrganizationProviderType
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<OrganizationProviderType> Create(OrganizationProviderType item)
    {
      throw new NotImplementedException();
    }

    public Task<OrganizationProviderType> Update(OrganizationProviderType item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(OrganizationProviderType item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
