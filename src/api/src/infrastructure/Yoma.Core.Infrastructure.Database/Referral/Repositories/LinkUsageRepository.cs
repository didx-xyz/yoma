using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories
{
  public class LinkUsageRepository : BaseRepository<Entities.LinkUsage, Guid>, IRepositoryBatched<LinkUsage>
  {
    #region Constructor
    public LinkUsageRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<LinkUsage> Query()
    {
      return _context.ReferralLinkUsage.Select(entity => new LinkUsage
      {
        Id = entity.Id,
        ProgramId = entity.ProgramId,
        LinkId = entity.LinkId,
        UserId = entity.UserId,
        StatusId = entity.StatusId,
        Status = Enum.Parse<Domain.Referral.LinkUsageStatus>(entity.Status.Name, true),
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<LinkUsage> Create(LinkUsage item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.LinkUsage
      {
        Id = item.Id,
        ProgramId = item.ProgramId,
        LinkId = item.LinkId,
        UserId = item.UserId,
        StatusId = item.StatusId,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.ReferralLinkUsage.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<List<LinkUsage>> Create(List<LinkUsage> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var entities = items.Select(item =>
        new Entities.LinkUsage
        {
          Id = item.Id,
          ProgramId = item.ProgramId,
          LinkId = item.LinkId,
          UserId = item.UserId,
          StatusId = item.StatusId,
          DateCreated = DateTimeOffset.Now,
          DateModified = DateTimeOffset.Now
        });

      _context.ReferralLinkUsage.AddRange(entities);
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

    public async Task<LinkUsage> Update(LinkUsage item)
    {
      var entity = _context.ReferralLinkUsage.Where(o => o.Id == item.Id).SingleOrDefault()
          ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.LinkUsage)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.StatusId = item.StatusId;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<List<LinkUsage>> Update(List<LinkUsage> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var itemIds = items.Select(o => o.Id).ToList();
      var entities = _context.ReferralLinkUsage.Where(o => itemIds.Contains(o.Id));

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(Entities.LinkUsage)} with id '{item.Id}' does not exist");

        item.DateModified = DateTimeOffset.UtcNow;

        entity.StatusId = item.StatusId;
        entity.DateModified = item.DateModified;
      }

      _context.ReferralLinkUsage.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }


    public Task Delete(LinkUsage item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(List<LinkUsage> items)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
