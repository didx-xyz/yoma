using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.AriesCloud.Context;
using Yoma.Core.Infrastructure.AriesCloud.Models;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.AriesCloud.Repositories
{
  public class ConnectionRepository : BaseRepository<Entities.Connection, Guid>, IRepository<Connection>
  {
    #region Constructor
    public ConnectionRepository(AriesCloudDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Connection> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Connection> Query()
    {
      return _context.Connection.Select(entity => new Connection
      {
        Id = entity.Id,
        SourceTenantId = entity.SourceTenantId,
        TargetTenantId = entity.TargetTenantId,
        SourceConnectionId = entity.SourceConnectionId,
        TargetConnectionId = entity.TargetConnectionId,
        Protocol = entity.Protocol,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<Connection> Create(Connection item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new Entities.Connection
      {
        Id = item.Id,
        SourceTenantId = item.SourceTenantId,
        TargetTenantId = item.TargetTenantId,
        SourceConnectionId = item.SourceConnectionId,
        TargetConnectionId = item.TargetConnectionId,
        Protocol = item.Protocol,
        DateCreated = item.DateCreated
      };

      _context.Connection.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<Connection> Update(Connection item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(Connection item)
    {
      var entity = _context.Connection.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.Connection)} with id '{item.Id}' does not exist");
      _context.Connection.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
