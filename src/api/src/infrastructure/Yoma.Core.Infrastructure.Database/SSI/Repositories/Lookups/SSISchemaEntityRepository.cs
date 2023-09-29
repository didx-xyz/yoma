using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core.Interfaces;
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
            return _context.SSISchemaObject.Select(entity => new SSISchemaEntity
            {
                Id = entity.Id,
                TypeName = entity.TypeName,
                Properties = includeChildItems ?
                    entity.Properties.Select(o => new SSISchemaEntityProperty { Id = o.Id, Name = o.Name, ValueDescription = o.ValueDescription, Required = o.Required }).ToList() : null
            }).AsSplitQuery();
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
