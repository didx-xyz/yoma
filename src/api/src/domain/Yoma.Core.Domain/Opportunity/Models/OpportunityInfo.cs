using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunityInfo
    {
        public Guid Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public string Type { get; set; }

        public string Organization { get; set; }

        public string? Instructions { get; set; }

        public string? URL { get; set; }

        public decimal? ZltoReward { get; set; }

        public decimal? YomaReward { get; set; }

        public string Difficulty { get; set; }

        public string CommitmentInterval { get; set; }

        public short? CommitmentIntervalCount { get; set; }

        public int? ParticipantLimit { get; set; }

        public int? ParticipantCount { get; set; }

        public string? Keywords { get; set; }

        public DateTimeOffset DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }

        public bool Published { get; set; }

        public List<Lookups.OpportunityCategory>? Categories { get; set; }

        public List<Country>? Countries { get; set; }

        public List<Language>? Languages { get; set; }

        public List<Skill>? Skills { get; set; }
    }
}
