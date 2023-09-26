using Newtonsoft.Json;

namespace Yoma.Core.Domain.SSI.Models.Lookups
{
    public class SSISchemaEntityProperty
    {
        public Guid Id { get; set; }

        [JsonIgnore]
        public string Name { get; set; }

        public string AttributeName { get; set; }

        public string TypeName { get; set; }

        [JsonIgnore]
        public string? DotNetType { get; set; }

        public string ValueDescription { get; set; }

        public bool Required { get; set; }
    }
}
