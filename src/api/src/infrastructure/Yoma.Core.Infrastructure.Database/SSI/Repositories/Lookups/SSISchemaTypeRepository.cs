using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.SSI.Repositories.Lookups
{
  public class SSISchemaTypeRepository : BaseRepository<Entities.Lookups.SSISchemaType, Guid>, IRepository<SSISchemaType>
  {
    #region Constructor
    public SSISchemaTypeRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<SSISchemaType> Query()
    {
      return _context.SSISchemaType.Select(entity => new SSISchemaType
      {
        Id = entity.Id,
        Type = Enum.Parse<SchemaType>(entity.Name, true),
        Name = entity.Name,
        Description = entity.Description,
        SupportMultiple = entity.SupportMultiple
      });
    }

    public Task<SSISchemaType> Create(SSISchemaType item)
    {
      throw new NotImplementedException();
    }

    public Task<SSISchemaType> Update(SSISchemaType item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(SSISchemaType item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
