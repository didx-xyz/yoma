namespace Yoma.Core.Domain.SSI.Models
{
    public abstract class SSICredentialBase
    {
        public string Id { get; set; }

        public ArtifactType ArtifactType { get; set; }

        public SchemaType SchemaType { get; set; }

        public string Issuer { get; set; }

        public string IssuerLogoURL { get; set; }

        public string Title { get; set; }

        public DateTimeOffset? DateIssued { get; set; }

        public virtual List<SSICredentialAttribute> Attributes { get; set; }
    }
}
