using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.PartnerSync.Entities;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.PartnerSync.Repositories
{
  public sealed class PartnerSyncUserRepository : BaseRepository<PartnerSyncUser, Guid>, IRepository<PartnerUser>
  {
    #region Constructor
    public PartnerSyncUserRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<PartnerUser> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<PartnerUser> Query()
    {
      return _context.PartnerUser.Select(entity => new PartnerUser
      {
        Id = entity.Id,
        PartnerId = entity.PartnerId,
        Partner = Enum.Parse<SyncPartner>(entity.Partner.Name, true),
        UserId = entity.UserId,
        Username = entity.Username,
        Email = entity.Email,
        PhoneNumber = entity.PhoneNumber,
        ExternalId = entity.ExternalId,
        DateLastRedirect = entity.DateLastRedirect,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<PartnerUser> Create(PartnerUser item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new PartnerSyncUser
      {
        Id = item.Id,
        PartnerId = item.PartnerId,
        UserId = item.UserId,
        Username = item.Username,
        Email = item.Email,
        PhoneNumber = item.PhoneNumber,
        ExternalId = item.ExternalId,
        DateLastRedirect = item.DateLastRedirect,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.PartnerUser.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<PartnerUser> Update(PartnerUser item)
    {
      var entity = _context.PartnerUser.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(PartnerUser)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.Username = item.Username;
      entity.Email = item.Email;
      entity.PhoneNumber = item.PhoneNumber;
      entity.ExternalId = item.ExternalId;
      entity.DateLastRedirect = item.DateLastRedirect;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public Task Delete(PartnerUser item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}

