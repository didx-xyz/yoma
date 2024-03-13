namespace Yoma.Core.Infrastructure.AriesCloud.Models
{
    public class Credential
    {
        public Guid Id { get; set; }

        public string ClientReferent { get; set; }

        public string SourceTenantId { get; set; }

        public string TargetTenantId { get; set; }

        public string SchemaId { get; set; }

        public string ArtifactType { get; set; }

        public string Attributes { get; set; }

        public string SignedValue { get; set; }

        public DateTimeOffset DateCreated { get; set; }
    }
}
