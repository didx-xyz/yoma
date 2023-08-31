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
    }
}
