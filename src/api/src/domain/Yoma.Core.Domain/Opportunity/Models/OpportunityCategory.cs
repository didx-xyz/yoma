using Yoma.Core.Domain.Entity;

namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunityCategory
    {
        public Guid Id { get; set; }

        public Guid OpportunityId { get; set; }

        public Guid OpportunityStatusId { get; set; }

        public Guid OrganizationStatusId { get; set; }

        public Guid CategoryId { get; set; }

        public DateTimeOffset DateCreated { get; set; }
    }
}
