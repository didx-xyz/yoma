using Newtonsoft.Json;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity;

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
                OpportunityId = value.OpportunityId,
                OpportunityTitle = value.OpportunityTitle,
                OpportunityType = value.OpportunityType,
                ActionId = value.ActionId,
                Action = value.Action,
                VerificationStatusId = value.VerificationStatusId,
                VerificationStatus = value.VerificationStatus,
                DateStart = value.DateStart,
                DateEnd = value.DateEnd,
                DateCompleted = value.DateCompleted,
                ZltoReward = value.ZltoReward,
                YomaReward = value.YomaReward,
                Verifications = value.Verifications?.Select(o =>
                    new MyOpportunityInfoVerification
                    {
                        VerificationType = o.VerificationType,
                        FileId = o.FileId,
                        Geometry = string.IsNullOrEmpty(o.GeometryProperties) ? null : JsonConvert.DeserializeObject<Geometry>(o.GeometryProperties)
                    }).ToList()
            };

            return result;
        }

        public static FileType? ToFileType(this VerificationType value)
        {
            return value switch
            {
                VerificationType.FileUpload => (FileType?)FileType.Certificates,
                VerificationType.Picture => (FileType?)FileType.Photos,
                VerificationType.VoiceNote => (FileType?)FileType.VoiceNotes,
                _ => null,
            };
        }
    }
}
