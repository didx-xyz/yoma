using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;

namespace Yoma.Core.Domain.SSI.Models
{
    public class CredentialFilter : PaginationFilter
    {
        public EntityType EntityType { get; set; }

        public Guid EntityId { get; set; }

        public SchemaType SchemaType { get; set; }  
    }
}
