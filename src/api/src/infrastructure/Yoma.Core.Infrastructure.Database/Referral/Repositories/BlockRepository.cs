using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories
{
  public class BlockRepository : BaseRepository<Entities.Block, Guid>, IRepository<Block>
  {
    #region Constructor
    public BlockRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Block> Query()
    {
      return _context.ReferralBlock.Select(entity => new Block
      {
        Id = entity.Id,
        UserId = entity.UserId,
        ReasonId = entity.ReasonId,
        Reason = entity.Reason.Name,
        ReasonDescription = entity.Reason.Description,
        CommentBlock = entity.CommentBlock,
        CommentUnBlock = entity.CommentUnblock,
        Active = entity.Active,
        DateCreated = entity.DateCreated,
        CreatedByUserId = entity.CreatedByUserId,
        DateModified = entity.DateModified,
        ModifiedByUserId = entity.ModifiedByUserId
      }); 
    }

    public async Task<Block> Create(Block item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.Block
      {
        Id = item.Id,
        UserId = item.UserId,
        ReasonId = item.ReasonId,
        CommentBlock = item.CommentBlock,
        CommentUnblock = item.CommentUnBlock,
        Active = item.Active,
        DateCreated = item.DateCreated,
        CreatedByUserId = item.CreatedByUserId,
        DateModified = item.DateModified,
        ModifiedByUserId = item.ModifiedByUserId
      };

      _context.ReferralBlock.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<Block> Update(Block item)
    {
      var entity = _context.ReferralBlock.Where(o => o.Id == item.Id).SingleOrDefault()
         ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.Block)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.CommentUnblock = item.CommentUnBlock;
      entity.Active = item.Active;

      await _context.SaveChangesAsync();

      return item;
    }

    public Task Delete(Block item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
