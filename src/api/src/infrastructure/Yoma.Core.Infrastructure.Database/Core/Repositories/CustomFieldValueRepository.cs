using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Core.Repositories
{
  public sealed class CustomFieldValueRepository : BaseRepository<Entities.CustomFieldValue, Guid>, IRepository<Domain.Core.Models.CustomFieldValue>
  {
    #region Constructor
    public CustomFieldValueRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<Domain.Core.Models.CustomFieldValue> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<Domain.Core.Models.CustomFieldValue> Query()
    {
      return _context.CustomFieldValue.Select(entity => new Domain.Core.Models.CustomFieldValue
      {
        Id = entity.Id,
        CustomFieldDefinitionId = entity.CustomFieldDefinitionId,
        OpportunityId = entity.OpportunityId,
        MyOpportunityId = entity.MyOpportunityId,
        Value = entity.Value,
        ValueNumeric = entity.ValueNumeric,
        ValueDateTime = entity.ValueDateTime,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<Domain.Core.Models.CustomFieldValue> Create(Domain.Core.Models.CustomFieldValue item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.CustomFieldValue
      {
        Id = item.Id,
        CustomFieldDefinitionId = item.CustomFieldDefinitionId,
        OpportunityId = item.OpportunityId,
        MyOpportunityId = item.MyOpportunityId,
        Value = item.Value,
        ValueNumeric = item.ValueNumeric,
        ValueDateTime = item.ValueDateTime,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.CustomFieldValue.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;

      return item;
    }

    public async Task<Domain.Core.Models.CustomFieldValue> Update(Domain.Core.Models.CustomFieldValue item)
    {
      var entity = _context.CustomFieldValue.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Core.Entities.CustomFieldValue)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.CustomFieldDefinitionId = item.CustomFieldDefinitionId;
      entity.OpportunityId = item.OpportunityId;
      entity.MyOpportunityId = item.MyOpportunityId;
      entity.Value = item.Value;
      entity.ValueNumeric = item.ValueNumeric;
      entity.ValueDateTime = item.ValueDateTime;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task Delete(Domain.Core.Models.CustomFieldValue item)
    {
      var entity = _context.CustomFieldValue.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Core.Entities.CustomFieldValue)} with id '{item.Id}' does not exist");

      _context.CustomFieldValue.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
