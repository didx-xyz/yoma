using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.NewsFeedProvider.Models;
using Yoma.Core.Infrastructure.Substack.Context;

namespace Yoma.Core.Infrastructure.Substack.Repositories
{
  public class NewsArticleRepository : BaseRepository<Entities.NewsArticle, Guid>, IRepositoryValueContains<NewsArticle>
  {
    #region Constructor
    public NewsArticleRepository(SubstackDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<NewsArticle> Query()
    {
      return _context.NewsArticle.Select(entity => new NewsArticle
      {
        Id = entity.Id,
        FeedType = entity.FeedType,
        ExternalId = entity.ExternalId,
        Title = entity.Title,
        Description = entity.Description,
        URL = entity.URL,
        ThumbnailURL = entity.ThumbnailURL,
        PublishedDate = entity.PublishedDate,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public Expression<Func<NewsArticle, bool>> Contains(Expression<Func<NewsArticle, bool>> predicate, string value)
    {
      return predicate.Or(o => EF.Functions.ILike(o.Title, $"%{value}%")
        || EF.Functions.ToTsVector("english", o.Description).Matches(value));
    }

    public IQueryable<NewsArticle> Contains(IQueryable<NewsArticle> query, string value)
    {
      return query.Where(o => EF.Functions.ILike(o.Title, $"%{value}%")
        || EF.Functions.ToTsVector("english", o.Description).Matches(value));
    }

    public async Task<NewsArticle> Create(NewsArticle item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.NewsArticle
      {
        Id = item.Id,
        FeedType = item.FeedType,
        ExternalId = item.ExternalId,
        Title = item.Title,
        Description = item.Description,
        URL = item.URL,
        ThumbnailURL = item.ThumbnailURL,
        PublishedDate = item.PublishedDate,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.NewsArticle.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<NewsArticle> Update(NewsArticle item)
    {
      var entity = _context.NewsArticle.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(NewsArticle)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.Title = item.Title;
      entity.Description = item.Description;
      entity.ThumbnailURL = item.ThumbnailURL;
      entity.DateModified = item.DateModified;  

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task Delete(NewsArticle item)
    {
      var entity = _context.NewsArticle.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(NewsArticle)} with id '{item.Id}' does not exist");

      _context.Remove(entity); //hard delete from cache based on retention period

      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
