namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunityVerificationType
    {
        public Guid Id { get; set; }

        public Guid OpportunityId { get; set; }

        public Guid VerificationTypeId { get; set; }

        public DateTimeOffset DateCreated { get; set; }
    }
}
