using FluentValidation;
using Flurl;
using Yoma.Core.Domain.ActionLink;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Opportunity.Models;

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

      var statuses = new Status[] { Status.Active, Status.Expired }; //ignore DateStart, includes both not started and started
      if (!statuses.Contains(opportunity.Status))
        return (false, $"Opportunity with id '{opportunity.Id}' has an invalid status. Expected status(es): '{statuses.JoinNames()}'");

      return (true, null);
    }

    public static void SetPublished(this Models.Opportunity opportunity)
    {
      ArgumentNullException.ThrowIfNull(opportunity, nameof(opportunity));

      opportunity.Published = Published(opportunity.Status, opportunity.OrganizationStatus);
    }

    public static OpportunityItem ToOpportunityItem(this Models.Opportunity value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      // completable calculated inline as loaded directly from the repo with referrals and not going through ToOpportunityInfo

      return new OpportunityItem
      {
        Id = value.Id,
        Title = value.Title.RemoveSpecialCharacters(),
        OrganizationStatus = value.OrganizationStatus,
        VerificationEnabled = value.VerificationEnabled,
        Status = value.Status,
        DateStart = value.DateStart
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
      if (link.EntityType != ActionLinkEntityType.Opportunity || link.Action != LinkAction.Verify)
        throw new ValidationException($"Link is not an instant verify link");
    }

    public static OpportunityInfo ToOpportunityInfo(this Models.Opportunity value, string appBaseURL)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      ArgumentException.ThrowIfNullOrWhiteSpace(appBaseURL, nameof(appBaseURL));
      appBaseURL = appBaseURL.Trim();

      var resultCompletable = value.Completable(out var reasonNonCompletable);

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
        IsCompletable = resultCompletable,
        NonCompletableReason = reasonNonCompletable,
        Categories = value.Categories,
        Countries = value.Countries,
        Languages = value.Languages,
        Skills = value.Skills,
        VerificationTypes = value.VerificationTypes
      };
    }

    public static bool Completable(this Models.Opportunity item, out string? reason)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      return EvaluateCompletable(item.Title, item.Status, item.OrganizationStatus, item.VerificationEnabled, item.DateStart, out reason);
    }

    public static bool Completable(this OpportunityItem item, out string? reason)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      return EvaluateCompletable(item.Title, item.Status, item.OrganizationStatus, item.VerificationEnabled, item.DateStart, out reason);
    }
    #endregion

    #region Private Members
    private static decimal? CalculateEstimatedReward(decimal? reward, decimal? organizationBalance, decimal? opportunityBalance)
    {
      if (!reward.HasValue) return null;

      if (organizationBalance.HasValue)
      {
        reward = Math.Max(Math.Min(reward.Value, organizationBalance.Value), default);
        if (reward == default) return default;
      }

      if (opportunityBalance.HasValue)
        reward = Math.Max(Math.Min(reward.Value, opportunityBalance.Value), default);

      return reward;
    }

    private static bool Published(Status status, Entity.OrganizationStatus organizationStatus)
    {
      return status == Status.Active && organizationStatus == Entity.OrganizationStatus.Active;
    }

    private static bool EvaluateCompletable(
        string title,
        Status status,
        Entity.OrganizationStatus organizationStatus,
        bool verificationEnabled,
        DateTimeOffset dateStart,
        out string? reason)
    {
      reason = null;

      var published = Published(status, organizationStatus);

      var canSendForVerification = status == Status.Expired || (published && dateStart <= DateTimeOffset.UtcNow);
      var isCompletable = canSendForVerification && verificationEnabled;

      if (isCompletable)
        return true;

      // collect reasons
      var reasons = new List<string>();

      if (!published)
        reasons.Add("it has not been published");

      if (status != Status.Active && status != Status.Expired)
        reasons.Add($"its status is '{status.ToDescription()}'");

      if (dateStart > DateTimeOffset.UtcNow)
        reasons.Add($"it has not yet started (start date: {dateStart:yyyy-MM-dd})");

      if (!verificationEnabled)
        reasons.Add("verification is not enabled");

      reason = $"Opportunity '{title}' can not be completed, because {string.Join(", ", reasons)}";
      return false;
    }

    #endregion
  }
}
