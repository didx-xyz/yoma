using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Context;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.DidxMe.Repositories
{
  public class IssuanceMappingRepository : BaseRepository<Entities.IssuanceMapping, Guid>, IRepository<IssuanceMapping>
  {
    #region Constructor
    public IssuanceMappingRepository(ProviderDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<IssuanceMapping> Query(LockMode lockMode) => Query().WithLock(lockMode);

    public IQueryable<IssuanceMapping> Query()
    {
      return _context.IssuanceMapping.Select(entity => new IssuanceMapping
      {
        Id = entity.Id,
        TenantAlias = entity.TenantAlias,
        PresetMappingId = entity.PresetMappingId,
        TenantIdIssuer = entity.TenantIdIssuer,
        TenantIdHolder = entity.TenantIdHolder,
        ClientReferentKey = entity.ClientReferentKey,
        ClientReferentValue = entity.ClientReferentValue,
        IssuanceId = entity.IssuanceId,
        IssuerCredentialId = entity.IssuerCredentialId,
        WalletCredentialId = entity.WalletCredentialId,
        Status = entity.Status,
        DeliveryCompleted = entity.DeliveryCompleted,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified
      });
    }

    public async Task<IssuanceMapping> Create(IssuanceMapping item)
    {
      if (item.Id == Guid.Empty) item.Id = Guid.NewGuid();
      item.DateCreated = item.DateModified = DateTimeOffset.UtcNow;
      _context.IssuanceMapping.Add(new Entities.IssuanceMapping
      {
        Id = item.Id,
        TenantAlias = item.TenantAlias,
        PresetMappingId = item.PresetMappingId,
        TenantIdIssuer = item.TenantIdIssuer,
        TenantIdHolder = item.TenantIdHolder,
        ClientReferentKey = item.ClientReferentKey,
        ClientReferentValue = item.ClientReferentValue,
        IssuanceId = item.IssuanceId,
        IssuerCredentialId = item.IssuerCredentialId,
        WalletCredentialId = item.WalletCredentialId,
        Status = item.Status,
        DeliveryCompleted = item.DeliveryCompleted,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      });
      await _context.SaveChangesAsync();
      return item;
    }

    public async Task<IssuanceMapping> Update(IssuanceMapping item)
    {
      var entity = _context.IssuanceMapping.Single(entity => entity.Id == item.Id);
      item.DateModified = DateTimeOffset.UtcNow;
      entity.IssuanceId = item.IssuanceId;
      entity.IssuerCredentialId = item.IssuerCredentialId;
      entity.WalletCredentialId = item.WalletCredentialId;
      entity.DeliveryCompleted = item.DeliveryCompleted;
      entity.Status = item.Status;
      entity.DateModified = item.DateModified;
      await _context.SaveChangesAsync();
      return item;
    }

    public Task Delete(IssuanceMapping item) =>
      throw new NotSupportedException("Issuance correlation must be retained; deleting it does not delete a held credential");
    #endregion
  }
}
