using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Entity.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
  public class UserLoginHistoryRepository : BaseRepository<UserLoginHistory, Guid>, IRepository<Domain.Entity.Models.UserLoginHistory>
  {
    #region Constructor
    public UserLoginHistoryRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Entity.Models.UserLoginHistory> Query()
    {
      return _context.UserLoginHistory.Select(entity => new Domain.Entity.Models.UserLoginHistory
      {
        Id = entity.Id,
        UserId = entity.UserId,
        ClientId = entity.ClientId,
        IpAddress = entity.IpAddress,
        AuthMethod = entity.AuthMethod,
        AuthType = entity.AuthType,
        IdentityProvider = entity.IdentityProvider,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<Domain.Entity.Models.UserLoginHistory> Create(Domain.Entity.Models.UserLoginHistory item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;

      var entity = new UserLoginHistory
      {
        Id = item.Id,
        UserId = item.UserId,
        ClientId = item.ClientId,
        IpAddress = item.IpAddress,
        AuthMethod = item.AuthMethod,
        AuthType = item.AuthType,
        IdentityProvider = item.IdentityProvider,
        DateCreated = item.DateCreated,

      };

      _context.UserLoginHistory.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public Task<Domain.Entity.Models.UserLoginHistory> Update(Domain.Entity.Models.UserLoginHistory item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(Domain.Entity.Models.UserLoginHistory item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
