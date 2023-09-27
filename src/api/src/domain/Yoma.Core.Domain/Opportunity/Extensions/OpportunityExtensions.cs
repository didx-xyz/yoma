using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Extensions
{
    public static class OpportunityExtensions
    {
        public static void SetPublished(this Models.Opportunity opportunity)
        {
            if (opportunity == null)
                throw new ArgumentNullException(nameof(opportunity));

            opportunity.Published = opportunity.Status == Status.Active && opportunity.OrganizationStatus == Entity.OrganizationStatus.Active;
        }

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
                ParticipantCountVerificationCompleted = value.ParticipantCount ?? default,
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
