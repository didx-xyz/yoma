using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.ActionLink.Repositories
{
  internal class LinkUsageLogRepository : BaseRepository<Entities.LinkUsageLog, Guid>, IRepositoryValueContains<LinkUsageLog>
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
        Username = entity.User.Email ?? entity.User.PhoneNumber ?? string.Empty,
        UserEmail = entity.User.Email,
        UserDisplayName = entity.User.DisplayName ?? entity.User.Email ?? entity.User.PhoneNumber ?? string.Empty,
        UserPhoneNumber = entity.User.PhoneNumber,
        UserCountry = entity.User.Country == null ? null : entity.User.Country.Name,
        UserDateOfBirth = entity.User.DateOfBirth,
        DateCreated = entity.DateCreated
      });
    }

    public Expression<Func<LinkUsageLog, bool>> Contains(Expression<Func<LinkUsageLog, bool>> predicate, string value)
    {
      //MS SQL: Contains
      return predicate.Or(o => (!string.IsNullOrEmpty(o.UserEmail) && EF.Functions.ILike(o.UserEmail, $"%{value}%"))
        || (!string.IsNullOrEmpty(o.UserDisplayName) && EF.Functions.ILike(o.UserDisplayName, $"%{value}%"))
        || (!string.IsNullOrEmpty(o.UserPhoneNumber) && EF.Functions.ILike(o.UserPhoneNumber, $"%{value}%")));
    }

    public IQueryable<LinkUsageLog> Contains(IQueryable<LinkUsageLog> query, string value)
    {
      //MS SQL: Contains
      return query.Where(o => (!string.IsNullOrEmpty(o.UserEmail) && EF.Functions.ILike(o.UserEmail, $"%{value}%"))
        || (!string.IsNullOrEmpty(o.UserDisplayName) && EF.Functions.ILike(o.UserDisplayName, $"%{value}%"))
        || (!string.IsNullOrEmpty(o.UserPhoneNumber) && EF.Functions.ILike(o.UserPhoneNumber, $"%{value}%")));
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
