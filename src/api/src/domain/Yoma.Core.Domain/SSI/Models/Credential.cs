namespace Yoma.Core.Domain.SSI.Models
{
    public class Credential
    {
        public string Id { get; set; }

        public ArtifactType ArtifactType { get; set; }

        public SchemaType SchemaType { get; set; }

        public DateTimeOffset? DateIssued { get; set; }

        public List<CredentialAttribute> Attributes { get; set; }   
    }
}
