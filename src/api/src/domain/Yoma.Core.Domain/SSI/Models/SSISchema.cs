using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Models
{
    public class SSISchema
    {
        public string Id { get; set; }

        public string Name { get; set; }

        public string DisplayName { get; set; }

        public Guid TypeId { get; set; }

        public SchemaType Type { get; set; }

        public string TypeDescription { get; set; }

        public string Version { get; set; }

        public ArtifactType ArtifactType { get; set; }

        public List<SSISchemaEntity> Entities { get; set; }

        public int? PropertyCount { get; set; }
    }
}
