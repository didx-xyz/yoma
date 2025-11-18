using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories.Lookups
{
  public class LinkUsageStatusRepository : BaseRepository<Entities.Lookups.LinkUsageStatus, Guid>, IRepository<LinkUsageStatus>
  {
    #region Constructor
    public LinkUsageStatusRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<LinkUsageStatus> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<LinkUsageStatus> Query()
    {
      return _context.ReferralLinkUsageStatus.Select(entity => new LinkUsageStatus
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<LinkUsageStatus> Create(LinkUsageStatus item)
    {
      throw new NotImplementedException();
    }

    public Task<LinkUsageStatus> Update(LinkUsageStatus item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(LinkUsageStatus item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
