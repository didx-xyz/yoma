using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Entity.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
  public class OrganizationUserRepository : BaseRepository<OrganizationUser>, IRepository<Domain.Entity.Models.OrganizationUser>
  {
    #region Constructor
    public OrganizationUserRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Entity.Models.OrganizationUser> Query()
    {
      return _context.OrganizationUsers.Select(entity => new Domain.Entity.Models.OrganizationUser
      {
        Id = entity.Id,
        OrganizationId = entity.OrganizationId,
        UserId = entity.UserId,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<Domain.Entity.Models.OrganizationUser> Create(Domain.Entity.Models.OrganizationUser item)
    {
      item.DateCreated = DateTimeOffset.Now;

      var entity = new OrganizationUser
      {
        Id = item.Id,
        OrganizationId = item.OrganizationId,
        UserId = item.UserId,
        DateCreated = item.DateCreated,

      };

      _context.OrganizationUsers.Add(entity);
      await _context.SaveChangesAsync();
      item.Id = entity.Id;

      return item;
    }

    public Task Update(Domain.Entity.Models.OrganizationUser item)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(Domain.Entity.Models.OrganizationUser item)
    {
      var entity = _context.OrganizationUsers.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(OrganizationUser)} with id '{item.Id}' does not exist");
      _context.OrganizationUsers.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
