namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunitySkill
    {
        public Guid Id { get; set; }

        public Guid OpportunityId { get; set; }

        public Guid SkillId { get; set; }

        public DateTimeOffset DateCreated { get; set; }
    }
}
