using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Helpers
{
    public static class OpportunityHelper
    {
        public static OpportunityInfo ToOpportunityInfo(this Models.Opportunity value)
        {
            if (value == null)
                throw new ArgumentNullException(nameof(value));

            return new OpportunityInfo
            {
                Id = value.Id,
                Title = value.Title,
                Description = value.Description,
                Type = value.Type,
                Organization = value.Organization,
                Instructions = value.Instructions,
                URL = value.URL,
                ZltoReward = value.ZltoReward,
                YomaReward = value.YomaReward,
                Difficulty = value.Difficulty,
                CommitmentInterval = value.CommitmentInterval,
                CommitmentIntervalCount = value.CommitmentIntervalCount,
                ParticipantLimit = value.ParticipantLimit,
                ParticipantCount = value.ParticipantCount,
                Keywords = value.Keywords,
                DateStart = value.DateStart,
                DateEnd = value.DateEnd,
                Published = value.Published,
                Categories = value.Categories,
                Countries = value.Countries,
                Languages = value.Languages,
                Skills = value.Skills

            };
        }
    }
}
