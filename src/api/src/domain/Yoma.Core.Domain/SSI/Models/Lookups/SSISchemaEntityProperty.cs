using Newtonsoft.Json;

namespace Yoma.Core.Domain.SSI.Models.Lookups
{
    public class SSISchemaEntityProperty
    {
        public Guid Id { get; set; }

        [JsonIgnore]
        public string Name { get; set; }

        public string NameDisplay { get; set; }

        public string Description { get; set; }

        public string AttributeName { get; set; }

        public string TypeName { get; set; }

        [JsonIgnore]
        public string? DotNetType { get; set; }

        public bool System { get; set; }

        [JsonIgnore]
        public SchemaEntityPropertySystemType? SystemType { get; set; }

        [JsonIgnore]
        public string? Format { get; set; }

        public bool Required { get; set; }
    }
}
