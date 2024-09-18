namespace Yoma.Core.Domain.Core.Models
{
  public class ScheduleJobOptions
  {
    public const string Section = "ScheduleJob";

    public int DefaultScheduleMaxIntervalInHours { get; set; }

    public int DistributedLockDurationBufferInMinutes { get; set; }

    public string SeedSkillsSchedule { get; set; }

    public int SeedSkillsBatchSize { get; set; }

    public string SeedJobTitlesSchedule { get; set; }

    public int SeedJobTitlesBatchSize { get; set; }

    public string OpportunityExpirationSchedule { get; set; }

    public string OpportunityExpirationNotificationSchedule { get; set; }

    public int OpportunityExpirationNotificationIntervalInDays { get; set; }

    public int OpportunityExpirationBatchSize { get; set; }

    public string OpportunityDeletionSchedule { get; set; }

    public int OpportunityDeletionBatchSize { get; set; }

    public int OpportunityDeletionIntervalInDays { get; set; }

    public string OrganizationDeclinationSchedule { get; set; }

    public int OrganizationDeclinationBatchSize { get; set; }

    public int OrganizationDeclinationIntervalInDays { get; set; }

    public string OrganizationDeletionSchedule { get; set; }

    public int OrganizationDeletionBatchSize { get; set; }

    public int OrganizationDeletionIntervalInDays { get; set; }

    public string MyOpportunityRejectionSchedule { get; set; }

    public int MyOpportunityRejectionBatchSize { get; set; }

    public int MyOpportunityRejectionIntervalInDays { get; set; }

    public string SSITenantCreationSchedule { get; set; }

    public int SSITenantCreationScheduleBatchSize { get; set; }

    public int SSITenantCreationScheduleMaxIntervalInHours { get; set; }

    public string SSICredentialIssuanceSchedule { get; set; }

    public int SSICredentialIssuanceScheduleBatchSize { get; set; }

    public int SSICredentialIssuanceScheduleMaxIntervalInHours { get; set; }

    public string RewardWalletCreationSchedule { get; set; }

    public int RewardWalletCreationScheduleBatchSize { get; set; }

    public int RewardWalletCreationScheduleMaxIntervalInHours { get; set; }

    public string RewardTransactionSchedule { get; set; }

    public int RewardTransactionScheduleBatchSize { get; set; }

    public int RewardTransactionScheduleMaxIntervalInHours { get; set; }

    public string ActionLinkExpirationSchedule { get; set; }

    public int ActionLinkExpirationScheduleBatchSize { get; set; }

    public string ActionLinkDeletionSchedule { get; set; }

    public int ActionLinkDeletionScheduleBatchSize { get; set; }

    public int ActionLinkDeletionScheduleIntervalInDays { get; set; }

    public string ActionLinkDeclinationSchedule { get; set; }

    public int ActionLinkDeclinationScheduleBatchSize { get; set; }

    public int ActionLinkDeclinationScheduleIntervalInDays { get; set; }

    public string PartnerSharingSchedule { get; set; }

    public int PartnerSharingScheduleBatchSize { get; set; }

    public int PartnerSharingScheduleMaxIntervalInHours { get; set; }

    public string OpportunityPublishedNotificationSchedule { get; set; }

    public int OpportunityPublishedNotificationIntervalInDays { get; set; }

    public string StoreAccessControlRuleDeletionSchedule { get; set; }

    public int StoreAccessControlRuleDeletionScheduleBatchSize { get; set; }

    public int StoreAccessControlRuleDeletionScheduleIntervalInDays { get; set; }
  }
}
