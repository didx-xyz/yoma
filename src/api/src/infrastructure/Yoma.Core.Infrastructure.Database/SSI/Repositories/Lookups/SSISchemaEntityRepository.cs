using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.SSI.Repositories.Lookups
{
  public class SSISchemaEntityRepository : BaseRepository<Entities.Lookups.SSISchemaEntity, Guid>, IRepositoryWithNavigation<SSISchemaEntity>
  {
    #region Constructor
    public SSISchemaEntityRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<SSISchemaEntity> Query()
    {
      return Query(false);
    }

    public IQueryable<SSISchemaEntity> Query(bool includeChildItems)
    {
      return _context.SSISchemaEntity.Select(entity => new SSISchemaEntity
      {
        Id = entity.Id,
        TypeName = entity.TypeName,
        Properties = includeChildItems ?
              entity.Properties.Select(o =>
              new SSISchemaEntityProperty
              {
                Id = o.Id,
                Name = o.Name,
                NameDisplay = o.NameDisplay,
                Description = o.Description,
                System = !string.IsNullOrEmpty(o.SystemType),
                SystemType = string.IsNullOrEmpty(o.SystemType) ? null : Enum.Parse<SchemaEntityPropertySystemType>(o.SystemType, true),
                Format = o.Format,
                Required = o.Required
              }).OrderBy(o => o.NameDisplay).ToList() : null,
        Types = includeChildItems ?
              entity.Types.Select(o => new SSISchemaType
              {
                Id = o.SSISchemaTypeId,
                Type = Enum.Parse<SchemaType>(o.SSISchemaType.Name, true),
                Name = o.SSISchemaType.Name,
                Description = o.SSISchemaType.Description,
                SupportMultiple = o.SSISchemaType.SupportMultiple
              }).OrderBy(o => o.Name).ToList() : null
      }).AsSplitQuery(); //AsSingleQuery() causes bottlenecks;
    }

    public Task<SSISchemaEntity> Create(SSISchemaEntity item)
    {
      throw new NotImplementedException();
    }

    public Task<SSISchemaEntity> Update(SSISchemaEntity item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(SSISchemaEntity item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
