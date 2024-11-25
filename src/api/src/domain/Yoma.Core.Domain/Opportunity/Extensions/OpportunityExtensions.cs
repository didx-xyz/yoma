using Flurl;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.ActionLink;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Opportunity.Models;
using FluentValidation;

namespace Yoma.Core.Domain.Opportunity.Extensions
{
  public static class OpportunityExtensions
  {
    #region Public Members
    public static int TimeIntervalToHours(this Models.Opportunity opportunity)
    {
      ArgumentNullException.ThrowIfNull(opportunity, nameof(opportunity));

      var hours = 0;
      hours = opportunity.CommitmentInterval switch
      {
        TimeIntervalOption.Minute => (int)Math.Ceiling(opportunity.CommitmentIntervalCount / 60m),
        TimeIntervalOption.Hour => opportunity.CommitmentIntervalCount,
        TimeIntervalOption.Day => opportunity.CommitmentIntervalCount * 24,
        TimeIntervalOption.Week => opportunity.CommitmentIntervalCount * 24 * 7,
        TimeIntervalOption.Month => opportunity.CommitmentIntervalCount * 24 * 30,
        _ => throw new InvalidOperationException($"{nameof(TimeIntervalOption)} of '{opportunity.CommitmentInterval}' not supported"),
      };

      return hours;
    }

    public static int TimeIntervalToDays(this Models.Opportunity opportunity)
    {
      ArgumentNullException.ThrowIfNull(opportunity, nameof(opportunity));

      var days = 0;
      days = opportunity.CommitmentInterval switch
      {
        TimeIntervalOption.Minute => (int)Math.Ceiling(opportunity.CommitmentIntervalCount / (60m * 24)),
        TimeIntervalOption.Hour => (int)Math.Ceiling((double)opportunity.CommitmentIntervalCount / 24),
        TimeIntervalOption.Day => opportunity.CommitmentIntervalCount,
        TimeIntervalOption.Week => opportunity.CommitmentIntervalCount * 7,
        TimeIntervalOption.Month => opportunity.CommitmentIntervalCount * 30,
        _ => throw new InvalidOperationException($"{nameof(TimeIntervalOption)} of '{opportunity.CommitmentInterval}' not supported"),
      };

      return days;
    }

    public static (bool found, string? message) PublishedOrExpired(this Models.Opportunity opportunity)
    {
      ArgumentNullException.ThrowIfNull(opportunity, nameof(opportunity));

      if (opportunity.OrganizationStatus != Entity.OrganizationStatus.Active)
        return (false, $"Opportunity with id '{opportunity.Id}' belongs to an inactive organization");

      var statuses = new List<Status>() { Status.Active, Status.Expired }; //ignore DateStart, includes both not started and started
      if (!statuses.Contains(opportunity.Status))
        return (false, $"Opportunity with id '{opportunity.Id}' has an invalid status. Expected status(es): '{string.Join(", ", statuses)}'");

      return (true, null);
    }

    public static void SetPublished(this Models.Opportunity opportunity)
    {
      ArgumentNullException.ThrowIfNull(opportunity, nameof(opportunity));

      opportunity.Published = opportunity.Status == Status.Active && opportunity.OrganizationStatus == Entity.OrganizationStatus.Active;
    }

    public static OpportunityItem ToOpportunityItem(this Models.Opportunity value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return new OpportunityItem
      {
        Id = value.Id,
        Title = value.Title.RemoveSpecialCharacters()
      };
    }

    public static string YomaInfoURL(this Models.Opportunity value, string appBaseURL)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return appBaseURL.AppendPathSegment("opportunities").AppendPathSegment(value.Id).ToString();
    }

    public static string YomaInfoURL(this OpportunityItem value, string appBaseURL)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return appBaseURL.AppendPathSegment("opportunities").AppendPathSegment(value.Id).ToString();
    }

    public static string YomaInstantVerifyURL(this Models.Opportunity value, string appBaseURL)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return appBaseURL.AppendPathSegment("opportunities/actionLink/verify");
    }

    public static void AssertLinkInstantVerify(this LinkInfo link)
    {
      if (link.EntityType != LinkEntityType.Opportunity || link.Action != LinkAction.Verify)
        throw new ValidationException($"Link is not an instant verify link");
    }

    public static OpportunityInfo ToOpportunityInfo(this Models.Opportunity value, string appBaseURL)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      ArgumentException.ThrowIfNullOrWhiteSpace(appBaseURL, nameof(appBaseURL));
      appBaseURL = appBaseURL.Trim();

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
        ZltoReward = CalculateEstimatedReward(value.ZltoReward, value.OrganizationZltoRewardBalance, value.ZltoRewardBalance),
        ZltoRewardCumulative = value.ZltoRewardCumulative,
        YomaReward = CalculateEstimatedReward(value.YomaReward, value.OrganizationYomaRewardBalance, value.YomaRewardBalance),
        YomaRewardCumulative = value.YomaRewardCumulative,
        VerificationEnabled = value.VerificationEnabled,
        VerificationMethod = value.VerificationMethod,
        Difficulty = value.Difficulty,
        CommitmentInterval = value.CommitmentInterval,
        CommitmentIntervalCount = value.CommitmentIntervalCount,
        CommitmentIntervalDescription = value.CommitmentIntervalDescription,
        ParticipantLimit = value.ParticipantLimit,
        ParticipantCountCompleted = value.ParticipantCount ?? default,
        ParticipantLimitReached = value.ParticipantCount.HasValue && value.ParticipantLimit.HasValue && value.ParticipantCount.Value >= value.ParticipantLimit.Value,
        StatusId = value.StatusId,
        Status = value.Status,
        Keywords = value.Keywords,
        DateStart = value.DateStart,
        DateEnd = value.DateEnd,
        Featured = value.Featured ?? false,
        EngagementType = value.EngagementType,
        ShareWithPartners = value.ShareWithPartners ?? false,
        Hidden = value.Hidden ?? false,
        ExternalId = value.ExternalId,
        Published = value.Published,
        YomaInfoURL = value.YomaInfoURL(appBaseURL),
        Categories = value.Categories,
        Countries = value.Countries,
        Languages = value.Languages,
        Skills = value.Skills,
        VerificationTypes = value.VerificationTypes
      };
    }
    #endregion

    #region Private Members
    private static decimal? CalculateEstimatedReward(decimal? reward, decimal? organizationBalance, decimal? opportynityBalance)
    {
      if (!reward.HasValue) return null;

      if (organizationBalance.HasValue)
      {
        reward = Math.Max(Math.Min(reward.Value, organizationBalance.Value), default);
        if (reward == default) return default;
      }

      if (opportynityBalance.HasValue)
        reward = Math.Max(Math.Min(reward.Value, opportynityBalance.Value), default);

      return reward;
    }
    #endregion
  }
}
