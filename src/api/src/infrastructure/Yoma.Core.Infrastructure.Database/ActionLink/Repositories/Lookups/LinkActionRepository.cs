using Yoma.Core.Domain.ActionLink.Models.Lookups;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.ActionLink.Repositories.Lookups
{
  public class LinkActionRepository : BaseRepository<Entities.Lookups.LinkAction, Guid>, IRepository<LinkAction>
  {
    #region Constructor
    public LinkActionRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<LinkAction> Query()
    {
      return _context.LinkAction.Select(entity => new LinkAction
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<LinkAction> Create(LinkAction item)
    {
      throw new NotImplementedException();
    }

    public Task<LinkAction> Update(LinkAction item)
    {
      throw new NotImplementedException();
    }
    public Task Delete(LinkAction item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
