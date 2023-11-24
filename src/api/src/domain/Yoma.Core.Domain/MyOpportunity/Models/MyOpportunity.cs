using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
    public class MyOpportunity
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string UserEmail { get; set; }

        public string UserDisplayName { get; set; }

        public DateTimeOffset? UserDateOfBirth { get; set; }

        public string? UserCountry { get; set; }

        public string? UserCountryOfResidence { get; set; }

        public Guid? UserPhotoId { get; set; }

        public string? UserPhotoURL { get; set; }

        public Guid OpportunityId { get; set; }

        public string OpportunityTitle { get; set; }

        public string OpportunityDescription { get; set; }

        public string OpportunityType { get; set; }

        public Guid OpportunityStatusId { get; set; }

        public Opportunity.Status OpportunityStatus { get; set; }

        public string OpportunityCommitmentIntervalDescription { get; set; }

        public int OpportunityParticipantCountTotal { get; set; }

        public DateTimeOffset OpportunityDateStart { get; set; }

        public DateTimeOffset? OpportunityDateEnd { get; set; }

        public bool OpportunityCredentialIssuanceEnabled { get; set; }

        public string? OpportunitySSISchemaName { get; set; }

        public Guid OrganizationId { get; set; }

        public string OrganizationName { get; set; }

        public Guid? OrganizationLogoId { get; set; }

        public string? OrganizationLogoURL { get; set; }

        public Guid OrganizationStatusId { get; set; }

        public OrganizationStatus OrganizationStatus { get; set; }

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

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset DateModified { get; set; }

        public List<MyOpportunityVerification>? Verifications { get; set; }

        public List<Skill>? Skills { get; set; }
    }
}
