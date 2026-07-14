using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Core.Repositories
{
  public sealed class CustomFieldDefinitionRepository : BaseRepository<Entities.CustomFieldDefinition, Guid>, IRepositoryWithNavigation<Domain.Core.Models.CustomFieldDefinition>
  {
    #region Constructor
    public CustomFieldDefinitionRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<Domain.Core.Models.CustomFieldDefinition> Query()
    {
      return Query(false);
    }

    public IQueryable<Domain.Core.Models.CustomFieldDefinition> Query(LockMode lockMode)
    {
      return Query(false).WithLock(lockMode);
    }

    public IQueryable<Domain.Core.Models.CustomFieldDefinition> Query(bool includeChildItems, LockMode lockMode)
    {
      return Query(includeChildItems).WithLock(lockMode);
    }

    public IQueryable<Domain.Core.Models.CustomFieldDefinition> Query(bool includeChildItems)
    {
      var query = _context.CustomFieldDefinition.Select(entity => new Domain.Core.Models.CustomFieldDefinition
      {
        Id = entity.Id,
        EntityType = entity.EntityType,
        EntityContext = entity.EntityContext,
        Key = entity.Key,
        Title = entity.Title,
        Description = entity.Description,
        Group = entity.Group,
        SubGroup = entity.SubGroup,
        DataType = Enum.Parse<CustomFieldDataType>(entity.DataType, true),
        LookupType = entity.LookupType == null ? null : Enum.Parse<CustomFieldLookupType>(entity.LookupType, true),
        ValidationRegex = entity.ValidationRegex,
        ValidationErrorMessage = entity.ValidationErrorMessage,
        IsRequired = entity.IsRequired,
        SupportsMultiple = entity.SupportsMultiple,
        SortOrder = entity.SortOrder,
        IsActive = entity.IsActive,
        IsSystem = entity.IsSystem,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified,
        Options = includeChildItems ? entity.Options == null ? null : entity.Options
          .Select(option => new Domain.Core.Models.CustomFieldOption
          {
            Id = option.Id,
            CustomFieldDefinitionId = option.CustomFieldDefinitionId,
            Key = option.Key,
            Name = option.Name,
            SortOrder = option.SortOrder,
            IsActive = option.IsActive,
            DateCreated = option.DateCreated,
            DateModified = option.DateModified
          })
          .OrderBy(option => option.SortOrder)
          .ThenBy(option => option.Name)
          .ToList() : null
      });

      if (includeChildItems) query = query.AsSplitQuery();
      return query;
    }

    public async Task<Domain.Core.Models.CustomFieldDefinition> Create(Domain.Core.Models.CustomFieldDefinition item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Entities.CustomFieldDefinition
      {
        Id = item.Id,
        EntityType = item.EntityType,
        EntityContext = item.EntityContext,
        Key = item.Key,
        Title = item.Title,
        Description = item.Description,
        Group = item.Group,
        SubGroup = item.SubGroup,
        DataType = item.DataType.ToString(),
        LookupType = item.LookupType?.ToString(),
        ValidationRegex = item.ValidationRegex,
        ValidationErrorMessage = item.ValidationErrorMessage,
        IsRequired = item.IsRequired,
        SupportsMultiple = item.SupportsMultiple,
        SortOrder = item.SortOrder,
        IsActive = item.IsActive,
        IsSystem = item.IsSystem,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };

      _context.CustomFieldDefinition.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;

      return item;
    }

    public async Task<Domain.Core.Models.CustomFieldDefinition> Update(Domain.Core.Models.CustomFieldDefinition item)
    {
      var entity = _context.CustomFieldDefinition.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Core.Entities.CustomFieldDefinition)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.EntityType = item.EntityType;
      entity.EntityContext = item.EntityContext;
      entity.Key = item.Key;
      entity.Title = item.Title;
      entity.Description = item.Description;
      entity.Group = item.Group;
      entity.SubGroup = item.SubGroup;
      entity.DataType = item.DataType.ToString();
      entity.LookupType = item.LookupType?.ToString();
      entity.ValidationRegex = item.ValidationRegex;
      entity.ValidationErrorMessage = item.ValidationErrorMessage;
      entity.IsRequired = item.IsRequired;
      entity.SupportsMultiple = item.SupportsMultiple;
      entity.SortOrder = item.SortOrder;
      entity.IsActive = item.IsActive;
      entity.IsSystem = item.IsSystem;
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task Delete(Domain.Core.Models.CustomFieldDefinition item)
    {
      var entity = _context.CustomFieldDefinition.Where(o => o.Id == item.Id).SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Core.Entities.CustomFieldDefinition)} with id '{item.Id}' does not exist");

      _context.CustomFieldDefinition.Remove(entity);

      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
