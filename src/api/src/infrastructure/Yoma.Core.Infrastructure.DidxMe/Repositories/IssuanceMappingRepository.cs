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
      if (entity.TenantAlias != item.TenantAlias || entity.TenantIdHolder != item.TenantIdHolder ||
        entity.TenantIdIssuer != item.TenantIdIssuer || entity.PresetMappingId != item.PresetMappingId ||
        entity.ClientReferentKey != item.ClientReferentKey || entity.ClientReferentValue != item.ClientReferentValue)
        throw new InvalidOperationException("An issuance's identity and ownership cannot change");

      if ((entity.IssuanceId != null && entity.IssuanceId != item.IssuanceId) ||
        (entity.IssuerCredentialId != null && entity.IssuerCredentialId != item.IssuerCredentialId) ||
        (entity.WalletCredentialId != null && entity.WalletCredentialId != item.WalletCredentialId))
        throw new InvalidOperationException("A confirmed provider identifier cannot be replaced");

      item.DateModified = DateTimeOffset.UtcNow;
      entity.IssuanceId = item.IssuanceId;
      entity.IssuerCredentialId = item.IssuerCredentialId;
      entity.WalletCredentialId = item.WalletCredentialId;
      entity.DeliveryCompleted |= item.DeliveryCompleted;
      entity.DateModified = item.DateModified;
      await _context.SaveChangesAsync();
      return item;
    }

    public Task Delete(IssuanceMapping item) =>
      throw new NotSupportedException("Issuance correlation must be retained; deleting it does not delete a held credential");
    #endregion
  }
}
