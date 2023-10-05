using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.SSI.Repositories
{
    public class SSISchemaSchemaTypeRepository : BaseRepository<Entities.SSISchemaSchemaType, Guid>, IRepository<SSISchemaSchemaType>
    {
        #region Constructor
        public SSISchemaSchemaTypeRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<SSISchemaSchemaType> Query()
        {
            return _context.SSISchemaTypeSchemas.Select(entity => new SSISchemaSchemaType
            {
                Id = entity.Id,
                SSISchemaName = entity.SSISchemaName,
                SSISchemaTypeId = entity.SSISchemaTypeId,
                SSISSchemaTypeName = entity.SSISchemaType.Name,
                SSISchemaTypeDescription = entity.SSISchemaType.Description,
                DateCreated = entity.DateCreated
            });
        }

        public async Task<SSISchemaSchemaType> Create(SSISchemaSchemaType item)
        {
            item.DateCreated = DateTimeOffset.Now;

            var entity = new Entities.SSISchemaSchemaType
            {
                Id = item.Id,
                SSISchemaName = item.SSISchemaName,
                SSISchemaTypeId = item.SSISchemaTypeId,
                DateCreated = item.DateCreated,
            };

            _context.SSISchemaTypeSchemas.Add(entity);
            await _context.SaveChangesAsync();

            item.Id = entity.Id;
            return item;
        }

        public Task<SSISchemaSchemaType> Update(SSISchemaSchemaType item)
        {
            throw new NotImplementedException();
        }
        public Task Delete(SSISchemaSchemaType item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
