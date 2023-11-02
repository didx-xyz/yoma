using System.Data;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.SSI.Repositories
{
    public class SSICredentialIssuanceRepository : BaseRepository<Entities.SSICredentialIssuance, Guid>, IRepository<SSICredentialIssuance>
    {
        #region Constructor
        public SSICredentialIssuanceRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<SSICredentialIssuance> Query()
        {
            return _context.SSICredentialIssuance.Select(entity => new SSICredentialIssuance
            {
                Id = entity.Id,
                SchemaTypeId = entity.SchemaTypeId,
                SchemaType = Enum.Parse<Domain.SSI.Models.SchemaType>(entity.SchemaType.Name, true),
                ArtifactType = Enum.Parse<ArtifactType>(entity.ArtifactType, true),
                SchemaName = entity.SchemaName,
                SchemaVersion = entity.SchemaVersion,
                StatusId = entity.StatusId,
                Status = Enum.Parse<CredentialIssuanceStatus>(entity.Status.Name, true),
                UserId = entity.UserId,
                OrganizationId = entity.OrganizationId,
                MyOpportunityId = entity.MyOpportunityId,
                CredentialId = entity.CredentialId,
                ErrorReason = entity.ErrorReason,
                RetryCount = entity.RetryCount,
                DateCreated = entity.DateCreated,
                DateModified = entity.DateModified
            });
        }

        public async Task<SSICredentialIssuance> Create(SSICredentialIssuance item)
        {
            item.DateCreated = DateTimeOffset.Now;
            item.DateModified = DateTimeOffset.Now;

            var entity = new Entities.SSICredentialIssuance
            {
                Id = item.Id,
                SchemaTypeId = item.SchemaTypeId,
                ArtifactType = item.ArtifactType.ToString(),
                SchemaName = item.SchemaName,
                SchemaVersion = item.SchemaVersion,
                StatusId = item.StatusId,
                UserId = item.UserId,
                OrganizationId = item.OrganizationId,
                MyOpportunityId = item.MyOpportunityId,
                CredentialId = item.CredentialId,
                ErrorReason = item.ErrorReason,
                RetryCount = item.RetryCount,
                DateCreated = item.DateCreated,
                DateModified = item.DateModified
            };

            _context.SSICredentialIssuance.Add(entity);
            await _context.SaveChangesAsync();

            item.Id = entity.Id;
            return item;
        }

        public async Task<SSICredentialIssuance> Update(SSICredentialIssuance item)
        {
            var entity = _context.SSICredentialIssuance.Where(o => o.Id == item.Id).SingleOrDefault()
               ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.SSICredentialIssuance)} with id '{item.Id}' does not exist");

            item.DateModified = DateTimeOffset.Now;

            entity.CredentialId = item.CredentialId;
            entity.StatusId = item.StatusId;
            entity.ErrorReason = item.ErrorReason;
            entity.RetryCount = item.RetryCount;
            entity.DateModified = item.DateModified;

            await _context.SaveChangesAsync();

            return item;
        }

        public Task Delete(SSICredentialIssuance item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
