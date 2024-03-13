using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.AriesCloud.Context;
using Yoma.Core.Infrastructure.AriesCloud.Models;

namespace Yoma.Core.Infrastructure.AriesCloud.Repositories
{
    public class CredentialRepository : BaseRepository<Entities.Credential, Guid>, IRepository<Credential>
    {
        #region Constructor
        public CredentialRepository(AriesCloudDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<Credential> Query()
        {
            return _context.Credential.Select(entity => new Credential
            {
                Id = entity.Id,
                ClientReferent = entity.ClientReferent,
                SourceTenantId = entity.SourceTenantId,
                TargetTenantId = entity.TargetTenantId,
                SchemaId = entity.SchemaId,
                ArtifactType = entity.ArtifactType,
                Attributes = entity.Attributes,
                SignedValue = entity.SignedValue,
                DateCreated = entity.DateCreated
            });
        }

        public async Task<Credential> Create(Credential item)
        {
            item.DateCreated = DateTimeOffset.UtcNow;

            var entity = new Entities.Credential
            {
                Id = item.Id,
                ClientReferent = item.ClientReferent,
                SourceTenantId = item.SourceTenantId,
                TargetTenantId = item.TargetTenantId,
                SchemaId = item.SchemaId,
                ArtifactType = item.ArtifactType,
                Attributes = item.Attributes,
                SignedValue = item.SignedValue,
                DateCreated = item.DateCreated
            };

            _context.Credential.Add(entity);
            await _context.SaveChangesAsync();

            item.Id = entity.Id;
            return item;
        }
        public Task<Credential> Update(Credential item)
        {
            throw new NotImplementedException();
        }

        public Task Delete(Credential item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
