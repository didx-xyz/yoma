using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Infrastructure.AriesCloud.Context;
using Yoma.Core.Infrastructure.AriesCloud.Models;

namespace Yoma.Core.Infrastructure.AriesCloud.Repositories
{
    public class CredentialSchemaRepository : BaseRepository<Entities.CredentialSchema, string>, IRepository<CredentialSchema>
    {
        #region Constructor
        public CredentialSchemaRepository(AriesCloudDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<CredentialSchema> Query()
        {
            return _context.CredentialSchema.Select(entity => new CredentialSchema
            {
                Id = entity.Id,
                Name = entity.Name,
                Version = entity.Version,
                ArtifactType = Enum.Parse<ArtifactType>(entity.ArtifactType, true),
                AttributeNames = entity.AttributeNames,
                DateCreated = entity.DateCreated
            });
        }
        
        public async Task<CredentialSchema> Create(CredentialSchema item)
        {
            item.DateCreated = DateTimeOffset.Now;

            var entity = new Entities.CredentialSchema
            {
                Id = item.Id,
                Name = item.Name,
                Version = item.Version,
                ArtifactType = item.ArtifactType.ToString(),
                AttributeNames = item.AttributeNames,
                DateCreated = item.DateCreated
            };

            _context.CredentialSchema.Add(entity);
            await _context.SaveChangesAsync();

            item.Id = entity.Id;
            return item;
        }
        public Task<CredentialSchema> Update(CredentialSchema item)
        {
            throw new NotImplementedException();
        }

        public Task Delete(CredentialSchema item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
