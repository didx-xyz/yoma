using Yoma.Core.Domain.ActionLink;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.ActionLink.Repositories
{
  public class LinkRepository : BaseRepository<Entities.Link, Guid>, IRepository<Link>
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
        URL = entity.URL,
        ShortURL = entity.URL,
        ParticipantLimit = entity.ParticipantLimit,
        ParticipantCount = entity.ParticipantCount,
        DateEnd = entity.DateEnd,
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
        ParticipantLimit = item.ParticipantLimit,
        ParticipantCount = item.ParticipantCount,
        DateEnd = item.DateEnd,
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

    public async Task<Link> Update(Link item)
    {
      var entity = _context.Link.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.Link)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.ParticipantCount = item.ParticipantCount;
      entity.StatusId = item.StatusId;
      entity.DateModified = item.DateModified;
      entity.ModifiedByUserId = item.ModifiedByUserId;

      await _context.SaveChangesAsync();

      return item;
    }

    public Task Delete(Link item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
