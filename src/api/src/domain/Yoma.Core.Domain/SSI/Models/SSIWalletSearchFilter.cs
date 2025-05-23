using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;

namespace Yoma.Core.Domain.SSI.Models
{
  public class SSIWalletSearchFilter : PaginationFilter
  {
    [JsonIgnore]
    public EntityType EntityType { get; set; }

    [JsonIgnore]
    public Guid EntityId { get; set; }

    public SchemaType? SchemaType { get; set; }

    [JsonIgnore]
    internal bool TotalCountOnly { get; set; }
  }
}
