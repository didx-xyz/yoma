namespace Yoma.Core.Domain.Opportunity
{
    public enum Status
    {
        Active, //flagged as expired provided ended (notified)
        Deleted,
        Expired, //flagged as deleted if expired for x days
        Inactive, //flagged expired provided ended (notified), or as deleted if inactive for x days
    }

    public enum VerificationMethod
    {
        /// <summary>
        /// Verification via upload of proof based on the configured verification types
        /// </summary>
        Manual,
        /// <summary>
        /// Verification by the provider directly / automatically via SSI integration
        /// </summary>
        Automatic 
    }

    public enum VerificationType
    {
        FileUpload,
        Picture,
        Location,
        VoiceNote
    }
}
