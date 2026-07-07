using Newtonsoft.Json;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Extensions
{
  public static class MyOpportunityExtensions
  {
    public static int? TimeIntervalToDays(this Models.MyOpportunity myOpportunity)
    {
      ArgumentNullException.ThrowIfNull(myOpportunity, nameof(myOpportunity));

      if (!myOpportunity.OpportunityCommitmentInterval.HasValue || !myOpportunity.OpportunityCommitmentIntervalCount.HasValue)
        return null;

      var days = myOpportunity.OpportunityCommitmentInterval.Value switch
      {
        TimeIntervalOption.Minute => (int)Math.Ceiling(myOpportunity.OpportunityCommitmentIntervalCount.Value / (60m * 24)),
        TimeIntervalOption.Hour => (int)Math.Ceiling((double)myOpportunity.OpportunityCommitmentIntervalCount.Value / 24),
        TimeIntervalOption.Day => myOpportunity.OpportunityCommitmentIntervalCount.Value,
        TimeIntervalOption.Week => myOpportunity.OpportunityCommitmentIntervalCount.Value * 7,
        TimeIntervalOption.Month => myOpportunity.OpportunityCommitmentIntervalCount.Value * 30,
        _ => throw new InvalidOperationException($"{nameof(TimeIntervalOption)} of '{myOpportunity.OpportunityCommitmentInterval.Value}' not supported"),
      };

      return days;
    }

    public static MyOpportunityInfo ToInfo(this Models.MyOpportunity value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      var result = new MyOpportunityInfo
      {
        Id = value.Id,
        UserId = value.UserId,
        Username = value.Username,
        UserEmail = value.UserEmail,
        UserPhoneNumer = value.UserPhoneNumber,
        UserDisplayName = value.UserDisplayName,
        UserCountry = value.UserCountry,
        UserEducation = value.UserEducation,
        UserPhotoId = value.UserPhotoId,
        UserPhotoURL = value.UserPhotoURL,
        UserSettings = value.UserSettings,
        OpportunityId = value.OpportunityId,
        OpportunityTitle = value.OpportunityTitle,
        OpportunityDescription = value.OpportunityDescription,
        OpportunitySummary = value.OpportunitySummary,
        OpportunityType = value.OpportunityType,
        OpportunityCommitmentIntervalDescription = value.OpportunityCommitmentIntervalDescription,
        OpportunityParticipantCountTotal = value.OpportunityParticipantCountTotal,
        OpportunityDateStart = value.OpportunityDateStart,
        OpportunityDateEnd = value.OpportunityDateEnd,
        OrganizationId = value.OrganizationId,
        OrganizationName = value.OrganizationName,
        OrganizationLogoURL = value.OrganizationLogoURL,
        ActionId = value.ActionId,
        Action = value.Action,
        VerificationStatusId = value.VerificationStatusId,
        VerificationStatus = value.VerificationStatus,
        CommentVerification = value.CommentVerification,
        CommitmentInterval = value.CommitmentInterval,
        CommitmentIntervalCount = value.CommitmentIntervalCount,
        DateStart = value.DateStart,
        DateEnd = value.DateEnd,
        PercentComplete = value.PercentComplete,
        DateCompleted = value.DateCompleted,
        ZltoReward = value.ZltoReward,
        YomaReward = value.YomaReward,
        Recommendable = value.Recommendable,
        StarRating = value.StarRating,
        Feedback = value.Feedback,
        DateModified = value.DateModified,
        SyncedInfo = value.SyncedInfo,
        Verifications = value.Verifications?.Select(o =>
            new MyOpportunityInfoVerification
            {
              VerificationType = o.VerificationType,
              FileId = o.FileId,
              FileURL = o.FileURL,
              Geometry = string.IsNullOrEmpty(o.GeometryProperties) ? null : JsonConvert.DeserializeObject<Geometry>(o.GeometryProperties)
            }).ToList(),
        Skills = value.Skills
      };

      return result;
    }
  }
}
