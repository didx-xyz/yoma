using System.ComponentModel;

namespace Yoma.Core.Domain.Opportunity
{
  public enum OpportunitySearchOrderField
  {
    DateCreated,
    DateEnd,
    ZltoReward
  }

  public enum RewardType
  {
    [Description("None")]
    None,
    [Description("ZLTO")]
    ZLTO,
    [Description("Partner incentive")]
    PartnerIncentive,
  }

  public enum AccessibilitySupport
  {
    [Description("Yes")]
    Yes,
    [Description("No")]
    No,
    [Description("Available on request")]
    AvailableOnRequest,
  }

  public enum Status
  {
    Active, //flagged as expired provided ended (notified)
    [Description("Archived")]
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
    [Description("File Upload")]
    FileUpload,
    Picture,
    Location,
    [Description("Voice Note")]
    VoiceNote,
    Video
  }

  /// <summary>
  /// Member names match static db name
  /// </summary>
  public enum Type
  {
    Other,
    Learning,
    Event,
    Job,
    [Description("Impact Action")]
    ImpactAction,
    Entrepreneurship
  }

  public enum Category
  {
    Other
  }

  /// <summary>
  /// Only the programme option interpreted by cross-field validation belongs in code.
  /// Other programme values remain configurable custom-field options.
  /// </summary>
  public enum EntrepreneurshipProgrammeType
  {
    Other
  }

  /// <summary>
  /// Only options selected by application logic belong here; remaining CF options are metadata.
  /// Member names are stable option keys, while descriptions are display labels.
  /// </summary>
  public enum Difficulty
  {
    [Description("Any level")]
    AnyLevel
  }

  public enum UpdateAction
  {
    Complete,
    Countries,
    Hidden,
    Featured,
    Status,
    Other
  }

  /// <summary>
  /// Stable CF option keys interpreted by employment validation and partner mappings.
  /// </summary>
  public enum EmploymentType
  {
    Permanent,
    FixedTerm
  }

  /// <summary>
  /// Only the tools option that controls conditional text belongs in code.
  /// Remaining tools are configurable CF options, not logical enum members.
  /// </summary>
  public enum ImpactActionTool
  {
    Other
  }

}
