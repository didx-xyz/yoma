using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;

namespace Yoma.Core.Domain.SSI.Models
{
  public class SSIWalletFilter : PaginationFilter
  {
    [JsonIgnore]
    public EntityType EntityType { get; set; }

    [JsonIgnore]
    public Guid EntityId { get; set; }

    public SchemaType? SchemaType { get; set; }
  }
}
