namespace Yoma.Core.Domain.Opportunity
{
  public enum Status
  {
    Active, //flagged as expired provided ended (notified)
    Deleted,
    Expired, //flagged as deleted if expired and not modified for x days
    Inactive, //customer request: exclude Inactive from auto-deletion. Only Expired opportunities will be auto-deleted. Inactive will remain Inactive indefinitely until manually handled; flagged as deleted if inactive and not modified for x days
  }

  public enum VerificationMethod
  {
    /// <summary>
    /// Verification via upload of proof based on the configured verification types
    /// </summary>
    Manual,
    /// <summary>
    /// Verification by the provider directly / automatically via integration
    /// </summary>
    Automatic
  }

  public enum VerificationType
  {
    FileUpload,
    Picture,
    Location,
    VoiceNote,
    Video
  }

  public enum Type
  {
    Other,
    Learning
  }

  public enum Category
  {
    Other
  }

  public enum PublishedState
  {
    NotStarted,
    Active,
    Expired
  }
}
