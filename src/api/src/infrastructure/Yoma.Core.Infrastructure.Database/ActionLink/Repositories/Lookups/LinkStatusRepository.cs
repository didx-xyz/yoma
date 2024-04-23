using Yoma.Core.Domain.ActionLink.Models.Lookups;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.ActionLink.Repositories.Lookups
{
  public class LinkStatusRepository : BaseRepository<Entities.Lookups.LinkStatus, Guid>, IRepository<LinkStatus>
  {
    #region Constructor
    public LinkStatusRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<LinkStatus> Query()
    {
      return _context.LinkStatus.Select(entity => new LinkStatus
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<LinkStatus> Create(LinkStatus item)
    {
      throw new NotImplementedException();
    }

    public Task<LinkStatus> Update(LinkStatus item)
    {
      throw new NotImplementedException();
    }
    public Task Delete(LinkStatus item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
