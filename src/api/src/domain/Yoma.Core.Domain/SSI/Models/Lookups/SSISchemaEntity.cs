using Newtonsoft.Json;

namespace Yoma.Core.Domain.SSI.Models.Lookups
{
    public class SSISchemaEntity
    {
        public Guid Id { get; set; }

        public string Name { get; set; }

        [JsonIgnore]
        public string TypeName { get; set; }

        public List<SSISchemaEntityProperty>? Properties { get; set; }
    }
}
