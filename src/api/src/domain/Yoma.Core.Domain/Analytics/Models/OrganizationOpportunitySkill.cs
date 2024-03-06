namespace Yoma.Core.Domain.Analytics.Models
{
    public class OrganizationOpportunitySkill
    {
        public TimeIntervalSummary Items { get; set; }

        public OpportunitySkillTopCompleted TopCompleted { get; set; }
    }

    public class OpportunitySkillTopCompleted
    {
        public string Legend { get; set; }

        public List<Lookups.Models.Skill> TopCompleted { get; set; }
    }
}
