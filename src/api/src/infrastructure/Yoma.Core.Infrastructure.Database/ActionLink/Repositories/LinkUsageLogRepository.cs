using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.ActionLink.Repositories
{
  internal class LinkUsageLogRepository : BaseRepository<Entities.LinkUsageLog, Guid>, IRepository<LinkUsageLog>
  {
    #region Constructor
    public LinkUsageLogRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<LinkUsageLog> Query()
    {
      return _context.LinkUsageLog.Select(entity => new LinkUsageLog
      {
        Id = entity.Id,
        LinkId = entity.LinkId,
        UserId = entity.UserId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<LinkUsageLog> Create(LinkUsageLog item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new Entities.LinkUsageLog
      {
        Id = item.Id,
        LinkId = item.LinkId,
        UserId = item.UserId,
        DateCreated = item.DateCreated
      };

      _context.LinkUsageLog.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<LinkUsageLog> Update(LinkUsageLog item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(LinkUsageLog item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
