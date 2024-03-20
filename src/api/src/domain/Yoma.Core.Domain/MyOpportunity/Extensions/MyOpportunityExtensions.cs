using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Extensions
{
  public static class MyOpportunityExtensions
  {
    public static MyOpportunityInfo ToInfo(this Models.MyOpportunity value)
    {
      if (value == null)
        throw new ArgumentNullException(nameof(value));

      var result = new MyOpportunityInfo
      {
        Id = value.Id,
        UserId = value.UserId,
        UserEmail = value.UserEmail,
        UserDisplayName = value.UserDisplayName,
        UserCountry = value.UserCountry,
        UserEducation = value.UserEducation,
        UserPhotoId = value.UserPhotoId,
        UserPhotoURL = value.UserPhotoURL,
        OpportunityId = value.OpportunityId,
        OpportunityTitle = value.OpportunityTitle,
        OpportunityDescription = value.OpportunityDescription,
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
        DateStart = value.DateStart,
        DateEnd = value.DateEnd,
        DateCompleted = value.DateCompleted,
        ZltoReward = value.ZltoReward,
        YomaReward = value.YomaReward,
        DateModified = value.DateModified,
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
