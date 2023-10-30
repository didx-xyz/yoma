namespace Yoma.Core.Domain.SSI.Models
{
    public enum ArtifactType
    {
        Indy,
        Ld_proof
    }

    public enum Role
    {
        Holder,
        Issuer,
        Verifier
    }

    public enum SchemaType
    {
        Opportunity,
        YoID
    }

    public enum CredentialIssuanceStatus
    {
        Pending,
        Issued,
        Error
    }
}
