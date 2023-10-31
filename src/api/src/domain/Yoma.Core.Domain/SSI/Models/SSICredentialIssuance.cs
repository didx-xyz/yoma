namespace Yoma.Core.Domain.SSI.Models
{
    public class SSICredentialIssuance
    {
        public Guid Id { get; set; }

        public Guid SchemaTypeId { get; set; }

        public SchemaType SchemaType { get; set; }

        public ArtifactType ArtifactType { get; set; }

        public string SchemaName { get; set; }

        public string SchemaVersion { get; set; }

        public Guid StatusId { get; set; }

        public CredentialIssuanceStatus Status { get; set; }

        public Guid? UserId { get; set; }

        public Guid? OrganizationId { get; set; }

        public Guid? MyOpportunityId { get; set; }

        public string? CredentialId { get; set; }

        public string? ErrorReason { get; set; }

        public byte? RetryCount { get; set; }

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset DateModified { get; set; }
    }
}
