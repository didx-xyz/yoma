namespace Yoma.Core.Domain.Core.Models
{
  public class ScheduleJobOptions
  {
    public const string Section = "ScheduleJob";

    public int DefaultScheduleMaxIntervalInHours { get; set; }

    public int DistributedLockDurationBufferInMinutes { get; set; }

    public string SeedSkillsSchedule { get; set; } = null!;

    public int SeedSkillsBatchSize { get; set; }

    public string SeedJobTitlesSchedule { get; set; } = null!;

    public int SeedJobTitlesBatchSize { get; set; }

    public string OpportunityExpirationSchedule { get; set; } = null!;

    public string OpportunityExpirationNotificationSchedule { get; set; } = null!;

    public int OpportunityExpirationNotificationIntervalInDays { get; set; }

    public int OpportunityExpirationBatchSize { get; set; }

    public string OpportunityDeletionSchedule { get; set; } = null!;

    public int OpportunityDeletionBatchSize { get; set; }

    public int OpportunityDeletionIntervalInDays { get; set; }

    public string OrganizationDeclinationSchedule { get; set; } = null!;

    public int OrganizationDeclinationBatchSize { get; set; }

    public int OrganizationDeclinationIntervalInDays { get; set; }

    public string OrganizationDeletionSchedule { get; set; } = null!;

    public int OrganizationDeletionBatchSize { get; set; }

    public int OrganizationDeletionIntervalInDays { get; set; }

    public string MyOpportunityRejectionSchedule { get; set; } = null!;

    public int MyOpportunityRejectionBatchSize { get; set; }

    public int MyOpportunityRejectionIntervalInDays { get; set; }

    public string SSITenantCreationSchedule { get; set; } = null!;

    public int SSITenantCreationScheduleBatchSize { get; set; }

    public int SSITenantCreationScheduleMaxIntervalInHours { get; set; }

    public string SSICredentialIssuanceSchedule { get; set; } = null!;

    public int SSICredentialIssuanceScheduleBatchSize { get; set; }

    public int SSICredentialIssuanceScheduleMaxIntervalInHours { get; set; }

    public string RewardWalletCreationSchedule { get; set; } = null!;

    public int RewardWalletCreationScheduleBatchSize { get; set; }

    public int RewardWalletCreationScheduleMaxIntervalInHours { get; set; }

    public string RewardTransactionSchedule { get; set; } = null!;

    public int RewardTransactionScheduleBatchSize { get; set; }

    public int RewardTransactionScheduleMaxIntervalInHours { get; set; }

    public string ActionLinkExpirationSchedule { get; set; } = null!;

    public int ActionLinkExpirationScheduleBatchSize { get; set; }

    public string ActionLinkDeletionSchedule { get; set; } = null!;

    public int ActionLinkDeletionScheduleBatchSize { get; set; }

    public int ActionLinkDeletionScheduleIntervalInDays { get; set; }

    public string PartnerSharingSchedule { get; set; } = null!;

    public int PartnerSharingScheduleBatchSize { get; set; }

    public int PartnerSharingScheduleMaxIntervalInHours { get; set; }

    public string OpportunityPublishedNotificationSchedule { get; set; } = null!;

    public int OpportunityPublishedNotificationIntervalInDays { get; set; }

    public string StoreAccessControlRuleDeletionSchedule { get; set; } = null!;

    public int StoreAccessControlRuleDeletionScheduleBatchSize { get; set; }

    public int StoreAccessControlRuleDeletionScheduleIntervalInDays { get; set; }

    public string DownloadScheduleProcessingSchedule { get; set; } = null!;

    public int DownloadScheduleProcessingBatchSize { get; set; }

    public int DownloadScheduleProcessingMaxIntervalInHours { get; set; }

    public string DownloadScheduleDeletionSchedule { get; set; } = null!;

    public int DownloadScheduleDeletionBatchSize { get; set; }

    //download schedule deletion interval based on app setting 'DownloadScheduleLinkExpirationHours'

    public string ResumableUploadStoreDeletionSchedule { get; set; } = null!;

    public int ResumableUploadStoreDeletionBatchSize { get; set; }

    //resumable upload deletion interval based on app setting 'DownloadScheduleLinkExpirationHours'

    public string ReferralProgramExpirationSchedule { get; set; } = null!;

    // Recommended batch size: 100 programs per run.
    // Each program expiration cascades to all its links and link usages, potentially updating thousands of rows.
    // Keeping the batch size around 100 limits transaction size, reduces lock contention and WAL pressure,
    // while still providing good throughput for nightly expiration jobs.
    public int ReferralProgramExpirationScheduleBatchSize { get; set; }

    public string ReferralProgramHealthSchedule { get; set; } = null!;

    public int ReferralProgramHealthScheduleBatchSize { get; set; }

    public int ReferralProgramHealthScheduleGracePeriodInDays { get; set; }

    public string ReferralProgramDeletionSchedule { get; set; } = null!;

    public int ReferralProgramDeletionScheduleBatchSize { get; set; }

    public int ReferralProgramDeletionScheduleIntervalInDays { get; set; }

    public string ReferralLinkUsageExpirationSchedule { get; set; } = null!;

    public int ReferralLinkUsageExpirationScheduleBatchSize { get; set; }
  }
}
