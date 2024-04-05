using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;

namespace Yoma.Core.Domain.Entity.Models
{
  public class UserSkillOrganizationInfo
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public Guid? LogoId { get; set; }

    [JsonIgnore]
    public StorageType? LogoStorageType { get; set; }

    [JsonIgnore]
    public string? LogoKey { get; set; }

    public string? LogoURL { get; set; }
  }
}
