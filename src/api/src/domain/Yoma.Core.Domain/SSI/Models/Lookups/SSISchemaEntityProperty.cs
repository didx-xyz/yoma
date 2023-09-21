using Newtonsoft.Json;

namespace Yoma.Core.Domain.SSI.Models.Lookups
{
    public class SSISchemaEntityProperty
    {
        public Guid Id { get; set; }

        [JsonIgnore]
        public string Name { get; set; }

        public string NameAttribute { get; set; }

        public string TypeDisplayName { get; set; }

        [JsonIgnore]
        public string TypeDotNet { get; set; }

        public string ValueDescription { get; set; }

        public bool Required { get; set; }
    }
}
