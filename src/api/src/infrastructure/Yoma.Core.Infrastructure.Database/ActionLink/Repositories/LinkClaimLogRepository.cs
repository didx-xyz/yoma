using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.ActionLink.Repositories
{
  internal class LinkClaimLogRepository : BaseRepository<Entities.LinkClaimLog, Guid>, IRepository<LinkClaimLog>
  {
    #region Constructor
    public LinkClaimLogRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<LinkClaimLog> Query()
    {
      return _context.LinkClaimLog.Select(entity => new LinkClaimLog
      {
        Id = entity.Id,
        LinkId = entity.LinkId,
        UserId = entity.UserId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<LinkClaimLog> Create(LinkClaimLog item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
   
      var entity = new Entities.LinkClaimLog
      {
        Id = item.Id,
        LinkId = item.LinkId,
        UserId = item.UserId,
        DateCreated = item.DateCreated
      };

      _context.LinkClaimLog.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<LinkClaimLog> Update(LinkClaimLog item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(LinkClaimLog item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
