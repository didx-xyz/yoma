using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories
{
  public class LinkRepository : BaseRepository<Entities.Link, Guid>, IRepositoryBatchedValueContainsWithNavigation<ReferralLink>
  {
    #region Constructor
    public LinkRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<ReferralLink> Query()
    {
      return Query(false);
    }

    public IQueryable<ReferralLink> Query(bool includeChildItems, LockMode lockMode)
    {
      return Query(includeChildItems).WithLock(lockMode);
    }

    public IQueryable<ReferralLink> Query(LockMode lockMode)
    {
      return Query(false).WithLock(lockMode);
    }

    public IQueryable<ReferralLink> Query(bool includeChildItems)
    {
      var query = _context.ReferralLink.Select(entity => new ReferralLink
      {
        Id = entity.Id,
        Name = entity.Name,
        Description = entity.Description,
        ProgramId = entity.ProgramId,
        ProgramName = entity.Program.Name,
        ProgramDescription = entity.Program.Description,
        ProgramCompletionLimitReferee = entity.Program.CompletionLimitReferee,
        UserId = entity.UserId,
        Username = entity.User.Email ?? entity.User.PhoneNumber ?? string.Empty,
        UserDisplayName = entity.User.DisplayName ?? entity.User.Email ?? entity.User.PhoneNumber ?? string.Empty,
        UserEmail = entity.User.Email,
        UserEmailConfirmed = entity.User.EmailConfirmed,
        UserPhoneNumber = entity.User.PhoneNumber,
        UserPhoneNumberConfirmed = entity.User.PhoneNumberConfirmed,
        Blocked = includeChildItems &&
            entity.User.Blocks != null &&
            entity.User.Blocks.Any(o => o.Active),
        BlockedDate = includeChildItems && entity.User.Blocks != null
          ? entity.User.Blocks
            .Where(o => o.Active)
            .OrderByDescending(o => o.DateCreated)
            .Select(o => (DateTimeOffset?)o.DateCreated)
            .FirstOrDefault()
          : null,
        StatusId = entity.StatusId,
        Status = Enum.Parse<Domain.Referral.ReferralLinkStatus>(entity.Status.Name, true),
        URL = entity.URL,
        ShortURL = entity.ShortURL,
        CompletionTotal = entity.CompletionTotal,
        ZltoRewardCumulative = entity.ZltoRewardCumulative,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified,
        UsageCountsRaw = includeChildItems && entity.Usages != null
          ? entity.Usages
            .GroupBy(u => u.StatusId)
            .Select(g => new ReferralLinkUsageCount
            {
              StatusId = g.Key,
              Count = g.Count()
            })
            .ToList() : null
      });

      if (includeChildItems) query = query.AsSplitQuery();
      return query;
    }

    public Expression<Func<ReferralLink, bool>> Contains(Expression<Func<ReferralLink, bool>> predicate, string value)
    {
      //MS SQL: Contains
      return predicate.Or(o =>
          EF.Functions.ILike(o.Name, $"%{value}%") ||
          (!string.IsNullOrEmpty(o.Description) && EF.Functions.ILike(o.Description, $"%{value}%")) ||
          (!string.IsNullOrEmpty(o.UserDisplayName) && EF.Functions.ILike(o.UserDisplayName, $"%{value}%")) ||
          (!string.IsNullOrEmpty(o.UserEmail) && EF.Functions.ILike(o.UserEmail, $"%{value}%")) ||
          (!string.IsNullOrEmpty(o.UserPhoneNumber) && EF.Functions.ILike(o.UserPhoneNumber, $"%{value}%"))
      );
    }

    public IQueryable<ReferralLink> Contains(IQueryable<ReferralLink> query, string value)
    {
      //MS SQL: Contains
      return query.Where(o =>
          EF.Functions.ILike(o.Name, $"%{value}%") ||
          (!string.IsNullOrEmpty(o.Description) && EF.Functions.ILike(o.Description, $"%{value}%")) ||
          (!string.IsNullOrEmpty(o.UserDisplayName) && EF.Functions.ILike(o.UserDisplayName, $"%{value}%")) ||
          (!string.IsNullOrEmpty(o.UserEmail) && EF.Functions.ILike(o.UserEmail, $"%{value}%")) ||
          (!string.IsNullOrEmpty(o.UserPhoneNumber) && EF.Functions.ILike(o.UserPhoneNumber, $"%{value}%"))
      );
    }

    public async Task<ReferralLink> Create(ReferralLink item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.Link
      {
        Id = item.Id,
        Name = item.Name,
        Description = item.Description,
        ProgramId = item.ProgramId,
        UserId = item.UserId,
        StatusId = item.StatusId,
        URL = item.URL,
        ShortURL = item.ShortURL,
        CompletionTotal = item.CompletionTotal,
        ZltoRewardCumulative = item.ZltoRewardCumulative,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.ReferralLink.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<List<ReferralLink>> Create(List<ReferralLink> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var entities = items.Select(item =>
        new Entities.Link
        {
          Id = item.Id,
          Name = item.Name,
          Description = item.Description,
          ProgramId = item.ProgramId,
          UserId = item.UserId,
          StatusId = item.StatusId,
          URL = item.URL,
          ShortURL = item.ShortURL,
          CompletionTotal = item.CompletionTotal,
          ZltoRewardCumulative = item.ZltoRewardCumulative,
          DateCreated = DateTimeOffset.UtcNow,
          DateModified = DateTimeOffset.UtcNow
        });

      _context.ReferralLink.AddRange(entities);
      await _context.SaveChangesAsync();

      items = [.. items.Zip(entities, (item, entity) =>
      {
        item.Id = entity.Id;
        item.DateCreated = entity.DateCreated;
        item.DateModified = entity.DateModified;
        return item;
      })];

      return items;
    }

    public async Task<ReferralLink> Update(ReferralLink item)
    {
      var entity = _context.ReferralLink.Where(o => o.Id == item.Id).SingleOrDefault()
          ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.Link)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.Name = item.Name;
      entity.Description = item.Description;
      entity.StatusId = item.StatusId;
      entity.CompletionTotal = item.CompletionTotal;
      entity.ZltoRewardCumulative = item.ZltoRewardCumulative;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<List<ReferralLink>> Update(List<ReferralLink> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var itemIds = items.Select(o => o.Id).ToList();
      var entities = _context.ReferralLink.Where(o => itemIds.Contains(o.Id));

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(Entities.Link)} with id '{item.Id}' does not exist");

        item.DateModified = DateTimeOffset.UtcNow;

        entity.Name = item.Name;
        entity.Description = item.Description;
        entity.StatusId = item.StatusId;
        entity.CompletionTotal = item.CompletionTotal;
        entity.ZltoRewardCumulative = item.ZltoRewardCumulative;
        entity.DateModified = item.DateModified;
      }

      _context.ReferralLink.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }

    public Task Delete(ReferralLink item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(List<ReferralLink> items)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
