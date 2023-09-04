using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
    public class Opportunity
    {
        public Guid Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public Guid TypeId { get; set; }

        public string Type { get; set; }

        public Guid OrganizationId { get; set; }

        public string Organization { get; set; }

        public Guid OrganizationStatusId { get; set; }

        public OrganizationStatus OrganizationStatus { get; set; }

        public string? Instructions { get; set; }

        public string? URL { get; set; }

        public decimal? ZltoReward { get; set; }

        public decimal? ZltoRewardPool { get; set; }

        public decimal? ZltoRewardCumulative { get; set; }

        public decimal? YomaReward { get; set; }

        public decimal? YomaRewardPool { get; set; }

        public decimal? YomaRewardCumulative { get; set; }

        public bool VerificationSupported { get; set; }

        public Guid DifficultyId { get; set; }

        public string Difficulty { get; set; }

        public Guid CommitmentIntervalId { get; set; }

        public string CommitmentInterval { get; set; }

        public short? CommitmentIntervalCount { get; set; }

        public int? ParticipantLimit { get; set; }

        public int? ParticipantCount { get; set; }

        public Guid StatusId { get; set; }

        public Status Status { get; set; }

        public string? Keywords { get; set; }

        public DateTimeOffset DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }

        public DateTimeOffset DateCreated { get; set; }

        public string CreatedBy { get; set; }

        public DateTimeOffset DateModified { get; set; }

        public string ModifiedBy { get; set; }

        public bool Published { get; set; }

        public List<Lookups.OpportunityCategory>? Categories { get; set; }

        public List<Country>? Countries { get; set; }

        public List<Language>? Languages { get; set; }

        public List<Skill>? Skills { get; set; }
    }
}
