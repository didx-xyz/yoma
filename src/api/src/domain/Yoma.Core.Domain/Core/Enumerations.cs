using System.ComponentModel;

namespace Yoma.Core.Domain.Core
{
  public enum LockMode
  {
    // SELECT ... FOR UPDATE
    // When reading rows, PostgreSQL attempts to acquire a write-intent row lock.
    // If another transaction already holds a lock on a row,
    // the SELECT will WAIT at read-time until that row becomes unlocked.
    Wait,

    // SELECT ... FOR UPDATE SKIP LOCKED
    // When reading rows, PostgreSQL attempts to acquire a write-intent row lock.
    // If another transaction already holds a lock on a row,
    // the SELECT will NOT wait — the locked row is SKIPPED during read-time
    // and only currently-unlocked rows are returned.
    SkipLocked
  }

  [Flags]
  public enum Environment
  {
    None = 0,
    [Description("Local")]
    Local = 1,
    [Description("Development")]
    Development = 2,
    [Description("Testing / Staging")]
    Staging = 4,
    [Description("Production")]
    Production = 8
  }

  [Flags]
  public enum CacheItemType
  {
    None = 0,
    Lookups = 1, //lookup entities i.e. countries; reference data store in lookup db namespace
    AmazonS3Client = 2,
    Analytics = 3
  }

  public enum FileType
  {
    Photos, //general image storage: organization logos, referral program thumbnails, user profile photos, and opportunity completion photos
    Certificates,
    Documents,
    VoiceNotes,
    Videos,
    ZipArchive,
    CSV
  }

  public enum Country
  {
    [Description("WW")]
    Worldwide,
    [Description("ZA")]
    SouthAfrica
  }

  public enum Education
  {
    Other
  }

  public enum SpatialType
  {
    None,
    Point
  }

  public enum TimeIntervalOption
  {
    Minute,
    Hour,
    Day,
    Week,
    Month
  }

  public enum FilterSortOrder
  {
    Ascending,
    Descending
  }

  public enum Gender
  {
    [Description("Prefer not to say")]
    PreferNotToSay
  }

  public enum Language
  {
    [Description("EN")]
    English
  }

  /// <summary>
  /// Defines the CRUD-style operation represented by an event.
  /// This value is optional and should only be specified when the event
  /// semantically represents a Create, Update, or Delete action.
  /// For business or non-CRUD events, omit this value (set to on the event payload)
  /// </summary>
  public enum EventType
  {
    Create,
    Update,
    Delete
  }

  public enum EngagementTypeOption
  {
    Online,
    Offline,
    Hybrid
  }

  public enum DownloadScheduleStatus
  {
    Pending,
    Processed,
    Error,
    Deleted
  }

  public enum DownloadScheduleType
  {
    Opportunities,
    MyOpportunityVerifications,
    MyOpportunityVerificationFiles
  }

  public enum ExternalIdpProvider
  {
    [Description("google")]
    Google,
    [Description("facebook")]
    Facebook
  }

  public enum CSVImportErrorType
  {
    [Description("Header Missing")]
    HeaderMissing,
    [Description("Header Column Missing")]
    HeaderColumnMissing,
    [Description("Header Unexpected Column")]
    HeaderUnexpectedColumn,
    [Description("Header Duplicate Column")]
    HeaderDuplicateColumn,
    [Description("Required Field Missing")]
    RequiredFieldMissing,
    [Description("Invalid Field Value")]
    InvalidFieldValue,
    [Description("Processing Error")]
    ProcessingError
  }

  /// <summary>
  /// Combines entity status with start and end dates to determine its published state
  /// </summary>
  public enum PublishedState
  {
    /// <summary>
    /// Active but not yet started.
    /// </summary>
    NotStarted,

    /// <summary>
    /// Active and currently running.
    /// </summary>
    Active,

    /// <summary>
    /// End date reached or expired.
    /// </summary>
    Expired
  }

  public enum SyncType
  {
    Push,
    Pull
  }

  public enum SyncScope
  {
    Entity,
    Verification,
    UserAuthentication
  }

  public enum SyncPartner
  {
    SAYouth,
    Jobberman,
    Alison
  }

  public enum CustomFieldEntityType
  {
    Opportunity,
    MyOpportunity
  }

  public enum CustomFieldDataType
  {
    String,
    Integer,
    Decimal,
    Boolean,
    DateTime,
    Option
  }

  public enum CustomFieldFilterOperator
  {
    Equals,
    Contains,
    AnyOf,
    AllOf,
    Exists
  }

  public enum CustomFieldLookupType
  {
    /// <summary>
    /// Country lookup values are available from the public relative route <c>api/v3/lookup/country</c>.
    /// </summary>
    Country,

    /// <summary>
    /// Language lookup values are available from the public relative route <c>api/v3/lookup/language</c>.
    /// </summary>
    Language,

    /// <summary>
    /// Skill lookup values are available from the public relative route <c>api/v3/lookup/skill</c>.
    /// </summary>
    Skill
  }

  public enum CustomFieldUpsertMode
  {
    /// <summary>
    /// Do not validate or modify custom-field values.
    /// Used by flows that do not support custom fields.
    /// </summary>
    None,

    /// <summary>
    /// Apply PUT-style replacement semantics: treat the supplied collection as the complete authoritative custom-field state.
    /// - Required fields must be supplied.
    /// - Supplied fields and values are validated and persisted.
    /// - Existing values for omitted fields are permanently deleted.
    /// - Each supplied field must have a specified value. Key-only items are not allowed.
    ///
    /// Used by standard API create and update flows, matching the PUT replacement semantics
    /// generally applied to other domain model properties and collections.
    /// </summary>
    PutEnforceRequired,

    /// <summary>
    /// Apply PATCH-style semantics: treat the supplied collection as a partial custom-field update.
    /// - Required fields may be omitted.
    /// - Supplied fields and values are validated and persisted.
    /// - Existing values for omitted fields are preserved.
    /// - A key-only field causes its existing value to be permanently deleted.
    ///
    /// Used by trusted partner synchronization and CSV import flows.
    /// </summary>
    PatchAllowMissingRequired
  }
}
