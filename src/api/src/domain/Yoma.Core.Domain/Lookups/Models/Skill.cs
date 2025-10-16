
using Newtonsoft.Json;

namespace Yoma.Core.Domain.Lookups.Models
{
  public class Skill
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    [JsonIgnore]
    public string ExternalId { get; set; } = null!;

    public string? InfoURL { get; set; }

    [JsonIgnore]
    public DateTimeOffset DateCreated { get; set; }

    [JsonIgnore]
    public DateTimeOffset DateModified { get; set; }
  }
}
