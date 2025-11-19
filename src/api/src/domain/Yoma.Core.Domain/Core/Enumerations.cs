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
}
