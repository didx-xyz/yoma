using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Extensions
{
  public static class OpportunityExtensions
  {
    public static int TimeIntervalToHours(this Models.Opportunity opportunity)
    {
      ArgumentNullException.ThrowIfNull(opportunity);

      if (!Enum.TryParse<TimeInterval>(opportunity.CommitmentInterval, true, out var interval))
        throw new ArgumentOutOfRangeException(nameof(opportunity), $"{nameof(opportunity.CommitmentInterval)} of '{opportunity.CommitmentInterval}' is not supported");

      var hours = 0;
      hours = interval switch
      {
        TimeInterval.Hour => opportunity.CommitmentIntervalCount,
        TimeInterval.Day => opportunity.CommitmentIntervalCount * 24,
        TimeInterval.Week => opportunity.CommitmentIntervalCount * 24 * 7,
        TimeInterval.Month => opportunity.CommitmentIntervalCount * 24 * 30,
        _ => throw new InvalidOperationException($"{nameof(TimeInterval)} of '{interval}' not supported"),
      };

      return hours;
    }

    public static void SetPublished(this Models.Opportunity opportunity)
    {
      ArgumentNullException.ThrowIfNull(opportunity);

      opportunity.Published = opportunity.Status == Status.Active && opportunity.OrganizationStatus == Entity.OrganizationStatus.Active;
    }

    public static OpportunitySearchCriteriaItem ToOpportunitySearchCriteria(this Models.Opportunity value)
    {
      ArgumentNullException.ThrowIfNull(value);

      return new OpportunitySearchCriteriaItem
      {
        Id = value.Id,
        Title = value.Title
      };
    }

    public static OpportunityInfo ToOpportunityInfo(this Models.Opportunity value)
    {
      ArgumentNullException.ThrowIfNull(value);

      return new OpportunityInfo
      {
        Id = value.Id,
        Title = value.Title,
        Description = value.Description,
        Type = value.Type,
        OrganizationId = value.OrganizationId,
        OrganizationName = value.OrganizationName,
        OrganizationLogoURL = value.OrganizationLogoURL,
        Summary = value.Summary,
        Instructions = value.Instructions,
        URL = value.URL,
        ZltoReward = value.ZltoReward,
        YomaReward = value.YomaReward,
        VerificationEnabled = value.VerificationEnabled,
        VerificationMethod = value.VerificationMethod,
        Difficulty = value.Difficulty,
        CommitmentInterval = value.CommitmentInterval,
        CommitmentIntervalCount = value.CommitmentIntervalCount,
        CommitmentIntervalDescription = value.CommitmentIntervalDescription,
        ParticipantLimit = value.ParticipantLimit,
        ParticipantCountVerificationCompleted = value.ParticipantCount ?? default,
        ParticipantLimitReached = value.ParticipantCount.HasValue && value.ParticipantLimit.HasValue && value.ParticipantCount.Value >= value.ParticipantLimit.Value,
        StatusId = value.StatusId,
        Status = value.Status,
        Keywords = value.Keywords,
        DateStart = value.DateStart,
        DateEnd = value.DateEnd,
        Published = value.Published,
        Categories = value.Categories,
        Countries = value.Countries,
        Languages = value.Languages,
        Skills = value.Skills,
        VerificationTypes = value.VerificationTypes
      };
    }
  }
}
