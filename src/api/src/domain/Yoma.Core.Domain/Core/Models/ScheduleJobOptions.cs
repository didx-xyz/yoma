namespace Yoma.Core.Domain.Core.Models
{
  public class ScheduleJobOptions
  {
    public const string Section = "ScheduleJob";

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
  }
}
