using Yoma.Core.Domain.Entity.Models.Lookups;

namespace Yoma.Core.Domain.Entity.Interfaces.Lookups
{
  public interface ISettingsDefinitionService
  {
    List<SettingsDefinition> ListByEntityType(EntityType type);
  }
}
