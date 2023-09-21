using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Models
{
    public class SSISchema
    {
        public string Id { get; set; }

        public string Name { get; set; }

        public string Version { get; set; }

        public List<SSISchemaEntity> Entities { get; set; }
    }
}
