using CsvHelper.Configuration.Attributes;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunityInfo
    {
        [Ignore]
        public Guid Id { get; set; }

        [Name("Opportunity Title")]
        public string Title { get; set; }

        [Name("Opportunity Description")]
        public string Description { get; set; }

        [Name("Opportunity Type")]
        public string Type { get; set; }

        [Ignore]
        public Guid OrganizationId { get; set; }

        [Name("Organization Name")]
        public string OrganizationName { get; set; }

        [Ignore]
        public string? OrganizationLogoURL { get; set; }

        public string? Instructions { get; set; }

        public string? URL { get; set; }

        [Name("Zlto Reward")]
        public decimal? ZltoReward { get; set; }

        [Name("Yoma Reward")]
        public decimal? YomaReward { get; set; }

        [Name("Verification Enabled")]
        [BooleanFalseValues("No")]
        [BooleanTrueValues("Yes")]
        public bool VerificationEnabled { get; set; }

        [Name("Verification Enabled")]
        public VerificationMethod? VerificationMethod { get; set; }

        public string Difficulty { get; set; }

        [Name("Commitment Interval")]
        public string CommitmentInterval { get; set; }

        [Name("Commitment Interval Count")]
        public short CommitmentIntervalCount { get; set; }

        [Name("Commitment Interval Description")]
        public string CommitmentIntervalDescription { get; set; }

        [Name("Participant Limit")]
        public int? ParticipantLimit { get; set; }

        [Name("Participant Count Verification Completed")]
        public int ParticipantCountVerificationCompleted { get; set; }

        [Name("Participant Count Verification Pending")]
        public int ParticipantCountVerificationPending { get; set; }

        [Name("Participant Count Total")]
        public int ParticipantCountTotal { get; set; }

        public Guid StatusId { get; set; }
        [Name("Status")]

        public Status Status { get; set; }
        [Name("Keywords")]

        public List<string>? Keywords { get; set; }
        [Name("Start Date")]

        public DateTimeOffset DateStart { get; set; }
        [Name("End Date")]

        public DateTimeOffset? DateEnd { get; set; }

        public bool Published { get; set; }

        public List<Lookups.OpportunityCategory>? Categories { get; set; }

        public List<Country>? Countries { get; set; }

        public List<Language>? Languages { get; set; }

        public List<Skill>? Skills { get; set; }

        [Name("Verification Types")]
        public List<Lookups.OpportunityVerificationType>? VerificationTypes { get; set; }
    }
}
