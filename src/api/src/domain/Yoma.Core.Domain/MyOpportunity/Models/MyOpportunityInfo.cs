namespace Yoma.Core.Domain.MyOpportunity.Models
{
    public class MyOpportunityInfo
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string UserEmail { get; set; }

        public string? UserDisplayName { get; set; }

        public string? UserCountry { get; set; }

        public string? UserCountryOfResidence { get; set; }

        public Guid? UserPhotoId { get; set; }

        public string? UserPhotoURL { get; set; }

        public Guid OpportunityId { get; set; }

        public string OpportunityTitle { get; set; }

        public string OpportunityDescription { get; set; }

        public string OpportunityType { get; set; }

        public string OpportunityCommitmentIntervalDescription { get; set; }

        public int OpportunityParticipantCountTotal { get; set; }

        public DateTimeOffset OpportunityDateStart { get; set; }

        public DateTimeOffset? OpportunityDateEnd { get; set; }

        public Guid OrganizationId { get; set; }

        public string OrganizationName { get; set; }

        public string? OrganizationLogoURL { get; set; }

        public Guid ActionId { get; set; }

        public Action Action { get; set; }

        public Guid? VerificationStatusId { get; set; }

        public VerificationStatus? VerificationStatus { get; set; }

        public string? CommentVerification { get; set; }

        public DateTimeOffset? DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }

        public DateTimeOffset? DateCompleted { get; set; }

        public decimal? ZltoReward { get; set; }

        public decimal? YomaReward { get; set; }

        public List<MyOpportunityInfoVerification>? Verifications { get; set; }
    }
}
