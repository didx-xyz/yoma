using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories.Lookups
{
  public class SettingsDefinitionRepository : BaseRepository<Entities.Lookups.SettingsDefinition, Guid>, IRepository<SettingsDefinition>
  {
    #region Constructor
    public SettingsDefinitionRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<SettingsDefinition> Query()
    {
      return _context.SettingsDefinition.Select(entity => new SettingsDefinition
      {
        Id = entity.Id,
        EntityType = Enum.Parse<EntityType>(entity.EntityType, true),
        Key = entity.Key,
        Title = entity.Title,
        Description = entity.Description,
        Group = entity.Group,
        SubGroup = entity.SubGroup,
        Order = entity.Order,
        Roles = JsonConvert.DeserializeObject<List<string>>(entity.Roles),
        DefaultValue = entity.DefaultValue,
        Type = Enum.Parse<SettingType>(entity.Type, true),
        Enabled = entity.Enabled,
        Visible = entity.Visible,
      });
    }

    public Task<SettingsDefinition> Create(SettingsDefinition item)
    {
      throw new NotImplementedException();
    }

    public Task<SettingsDefinition> Update(SettingsDefinition item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(SettingsDefinition item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
