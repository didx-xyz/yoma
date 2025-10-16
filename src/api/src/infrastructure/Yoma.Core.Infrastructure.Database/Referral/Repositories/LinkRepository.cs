using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories
{
  public class LinkRepository : BaseRepository<Entities.Link, Guid>, IRepositoryBatchedValueContains<ReferralLink>
  {
    #region Constructor
    public LinkRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<ReferralLink> Query()
    {
      return _context.ReferralLink.Select(entity => new ReferralLink
      {
        Id = entity.Id,
        Name = entity.Name,
        Description = entity.Description,
        ProgramId = entity.ProgramId,
        UserId = entity.UserId,
        StatusId = entity.StatusId,
        Status = Enum.Parse<Domain.Referral.ReferralLinkStatus>(entity.Status.Name, true),
        URL = entity.URL,
        ShortURL = entity.ShortURL,
        CompletionTotal = entity.CompletionTotal,
        ZltoRewardCumulative = entity.ZltoRewardCumulative,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public Expression<Func<ReferralLink, bool>> Contains(Expression<Func<ReferralLink, bool>> predicate, string value)
    {
      //MS SQL: Contains
      return predicate.Or(o => EF.Functions.ILike(o.Name, $"%{value}%")
          || (!string.IsNullOrEmpty(o.Description) && EF.Functions.ILike(o.Description, $"%{value}%")));
    }

    public IQueryable<ReferralLink> Contains(IQueryable<ReferralLink> query, string value)
    {
      //MS SQL: Contains
      return query.Where(o => EF.Functions.ILike(o.Name, $"%{value}%")
          || (!string.IsNullOrEmpty(o.Description) && EF.Functions.ILike(o.Description, $"%{value}%")));
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
