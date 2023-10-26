using Yoma.Core.Domain.Entity;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
    public class MyOpportunity
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string UserEmail { get; set; }

        public string? UserDisplayName { get; set; }

        public string? UserSSITenantId { get; set; }

        public Guid OpportunityId { get; set; }

        public string OpportunityTitle { get; set; }

        public string OpportunityType { get; set; }

        public Guid OpportunityStatusId { get; set; }

        public Opportunity.Status OpportunityStatus { get; set; }

        public DateTimeOffset OpportunityDateStart { get; set; }

        public bool OpportunityCredentialIssuanceEnabled { get; set; }

        public string? OpportunitySSISchemaName { get; set; }

        public Guid OrganizationId { get; set; }

        public string OrganizationName { get; set; }

        public Guid? OrganizationLogoId { get; set; }

        public string? OrganizationLogoURL { get; set; }

        public Guid OrganizationStatusId { get; set; }

        public OrganizationStatus OrganizationStatus { get; set; }

        public string? OrganizationSSITenantId { get; set; }

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

        public string? SSICredentialId { get; set; }

        public DateTimeOffset? DateSSICredentialIssued { get; set; }

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset DateModified { get; set; }

        public List<MyOpportunityVerification>? Verifications { get; set; }
    }
}
