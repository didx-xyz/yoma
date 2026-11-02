using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Infrastructure.DidxMe.Context;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.DidxMe.Repositories
{
  public class CredentialPresetMappingRepository : BaseRepository<Entities.CredentialPresetMapping, string>, IRepository<CredentialPresetMapping>
  {
    #region Constructor
    public CredentialPresetMappingRepository(ProviderDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<CredentialPresetMapping> Query(LockMode lockMode) => Query().WithLock(lockMode);

    public IQueryable<CredentialPresetMapping> Query()
    {
      return _context.CredentialPresetMapping.Select(entity => new CredentialPresetMapping
      {
        Id = entity.Id,
        TenantAlias = entity.TenantAlias,
        Name = entity.Name,
        Version = entity.Version,
        ArtifactType = Enum.Parse<ArtifactType>(entity.ArtifactType, true),
        AttributeNames = entity.AttributeNames,
        PresetId = entity.PresetId,
        Vct = entity.Vct,
        DateCreated = entity.DateCreated
      });
    }

    public async Task<CredentialPresetMapping> Create(CredentialPresetMapping item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      _context.CredentialPresetMapping.Add(new Entities.CredentialPresetMapping
      {
        Id = item.Id,
        TenantAlias = item.TenantAlias,
        Name = item.Name,
        Version = item.Version,
        ArtifactType = item.ArtifactType.ToString(),
        AttributeNames = item.AttributeNames,
        PresetId = item.PresetId,
        Vct = item.Vct,
        DateCreated = item.DateCreated
      });
      await _context.SaveChangesAsync();
      return item;
    }

    public Task<CredentialPresetMapping> Update(CredentialPresetMapping item) =>
      throw new NotSupportedException("Issued preset mappings are immutable; create a new version");

    public Task Delete(CredentialPresetMapping item) =>
      throw new NotSupportedException("Preset mappings are retained for issued credentials");
    #endregion
  }
}
