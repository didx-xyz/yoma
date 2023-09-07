namespace Yoma.Core.Domain.MyOpportunity.Models
{
    public class MyOpportunityInfo
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string UserDisplayName { get; set; }

        public Guid OpportunityId { get; set; }

        public string OpportunityTitle { get; set; }

        public string OpportunityType { get; set; }

        public Guid ActionId { get; set; }

        public Action Action { get; set; }

        public Guid? VerificationStatusId { get; set; }

        public VerificationStatus? VerificationStatus { get; set; }

        public Guid? CertificateId { get; set; }

        public string? CertificateURL { get; set; }

        public DateTimeOffset? DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }

        public DateTimeOffset? DateCompleted { get; set; }

        public decimal? ZltoReward { get; set; }

        public decimal? YomaReward { get; set; }
    }
}
