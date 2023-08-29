using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;

namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationDocument
    {
        [JsonIgnore]
        public Guid Id { get; set; }

        [JsonIgnore]
        public Guid OrganizationId { get; set; }

        public Guid FileId { get; set; }

        public string Type { get; set; }

        public string ContentType { get; set; }

        public string OriginalFileName { get; set; }

        public string Url { get; set; }

        [JsonIgnore]
        public IFormFile File { get; set; }

        public DateTimeOffset DateCreated { get; set; }
    }
}
