using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunityInfo
    {
        public Guid Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public string Type { get; set; }

        public string OrganizationName { get; set; }

        public string? OrganizationLogoURL { get; set; }

        public string? Instructions { get; set; }

        public string? URL { get; set; }

        public decimal? ZltoReward { get; set; }

        public decimal? YomaReward { get; set; }

        public bool VerificationEnabled { get; set; }

        public VerificationMethod? VerificationMethod { get; set; }

        public string Difficulty { get; set; }

        public string CommitmentInterval { get; set; }

        public short CommitmentIntervalCount { get; set; }

        public string CommitmentIntervalDescription { get; set; }

        public int? ParticipantLimit { get; set; }

        public int ParticipantCountVerificationCompleted { get; set; }

        public int ParticipantCountVerificationPending { get; set; }

        public int ParticipantCountTotal { get; set; }

        public Guid StatusId { get; set; }

        public Status Status { get; set; }

        public List<string>? Keywords { get; set; }

        public DateTimeOffset DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }

        public bool Published { get; set; }

        public List<Lookups.OpportunityCategory>? Categories { get; set; }

        public List<Country>? Countries { get; set; }

        public List<Language>? Languages { get; set; }

        public List<Skill>? Skills { get; set; }

        public List<Lookups.OpportunityVerificationType>? VerificationTypes { get; set; }
    }
}
