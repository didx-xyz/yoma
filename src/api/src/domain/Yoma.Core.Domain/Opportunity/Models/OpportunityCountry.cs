namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunityCountry
    {
        public Guid Id { get; set; }

        public Guid OpportunityId { get; set; }

        public Guid OpportunityStatusId { get; set; }

        public DateTimeOffset OpportunityDateStart { get; set; }

        public Guid OrganizationStatusId { get; set; }

        public Guid CountryId { get; set; }

        public DateTimeOffset DateCreated { get; set; }
    }
}
