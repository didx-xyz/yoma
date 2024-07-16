using Yoma.Core.Domain.ActionLink;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.ActionLink.Repositories
{
  public class LinkRepository : BaseRepository<Entities.Link, Guid>, IRepositoryBatched<Link>
  {
    #region Constructor
    public LinkRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Link> Query()
    {
      return _context.Link.Select(entity => new Link
      {
        Id = entity.Id,
        Name = entity.Name,
        Description = entity.Description,
        EntityType = entity.EntityType,
        Action = entity.Action,
        StatusId = entity.StatusId,
        Status = Enum.Parse<LinkStatus>(entity.Status.Name, true),
        OpportunityId = entity.OpportunityId,
        OpportunityTitle = entity.Opportunity == null ? null : entity.Opportunity.Title,
        OpportunityOrganizationId = entity.Opportunity == null ? null : entity.Opportunity.OrganizationId,
        URL = entity.URL,
        ShortURL = entity.ShortURL,
        UsagesLimit = entity.UsagesLimit,
        UsagesTotal = entity.UsagesTotal,
        DateEnd = entity.DateEnd,
        DistributionList = entity.DistributionList,
        LockToDistributionList = entity.LockToDistributionList,
        CommentApproval = entity.CommentApproval,
        DateCreated = entity.DateCreated,
        CreatedByUserId = entity.CreatedByUserId,
        DateModified = entity.DateModified,
        ModifiedByUserId = entity.ModifiedByUserId
      });
    }

    public async Task<Link> Create(Link item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.Link
      {
        Id = item.Id,
        Name = item.Name,
        Description = item.Description,
        EntityType = item.EntityType,
        Action = item.Action,
        StatusId = item.StatusId,
        OpportunityId = item.OpportunityId,
        URL = item.URL,
        ShortURL = item.ShortURL,
        UsagesLimit = item.UsagesLimit,
        UsagesTotal = item.UsagesTotal,
        DateEnd = item.DateEnd,
        DistributionList = item.DistributionList,
        LockToDistributionList = item.LockToDistributionList,
        CommentApproval = item.CommentApproval,
        DateCreated = item.DateCreated,
        CreatedByUserId = item.CreatedByUserId,
        DateModified = item.DateModified,
        ModifiedByUserId = item.ModifiedByUserId
      };

      _context.Link.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<List<Link>> Create(List<Link> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var entities = items.Select(item =>
         new Entities.Link
         {
           Id = item.Id,
           Name = item.Name,
           Description = item.Description,
           EntityType = item.EntityType,
           Action = item.Action,
           StatusId = item.StatusId,
           OpportunityId = item.OpportunityId,
           URL = item.URL,
           ShortURL = item.ShortURL,
           UsagesLimit = item.UsagesLimit,
           UsagesTotal = item.UsagesTotal,
           DateEnd = item.DateEnd,
           DistributionList = item.DistributionList,
           LockToDistributionList = item.LockToDistributionList,
           CommentApproval = item.CommentApproval,
           DateCreated = DateTimeOffset.UtcNow,
           CreatedByUserId = item.CreatedByUserId,
           DateModified = DateTimeOffset.UtcNow,
           ModifiedByUserId = item.ModifiedByUserId
         });

      _context.Link.AddRange(entities);
      await _context.SaveChangesAsync();

      items = items.Zip(entities, (item, entity) =>
      {
        item.Id = entity.Id;
        item.DateCreated = entity.DateCreated;
        item.DateModified = entity.DateModified;
        return item;
      }).ToList();

      return items;
    }

    public async Task<Link> Update(Link item)
    {
      var entity = _context.Link.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.Link)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.UsagesTotal = item.UsagesTotal;
      entity.StatusId = item.StatusId;
      entity.CommentApproval = item.CommentApproval;
      entity.DateModified = item.DateModified;
      entity.ModifiedByUserId = item.ModifiedByUserId;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<List<Link>> Update(List<Link> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var itemIds = items.Select(o => o.Id).ToList();
      var entities = _context.Link.Where(o => itemIds.Contains(o.Id));

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(Link)} with id '{item.Id}' does not exist");

        item.DateModified = DateTimeOffset.UtcNow;

        entity.UsagesTotal = item.UsagesTotal;
        entity.StatusId = item.StatusId;
        entity.CommentApproval = item.CommentApproval;
        entity.DateModified = item.DateModified;
        entity.ModifiedByUserId = item.ModifiedByUserId;
      }

      _context.Link.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }

    public Task Delete(Link item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
