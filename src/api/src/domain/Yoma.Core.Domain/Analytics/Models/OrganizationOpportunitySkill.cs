namespace Yoma.Core.Domain.Analytics.Models
{
    public class OrganizationOpportunitySkill
    {
        public TimeIntervalSummary Items { get; set; }

        public List<Lookups.Models.Skill> TopCompleted { get; set; }
    }
}
