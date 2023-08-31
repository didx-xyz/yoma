using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Helpers
{
    public static class MyOpportunityHelper
    {
        public static MyOpportunityInfo ToInfo(this Models.MyOpportunity value)
        {
            if (value == null)
                throw new ArgumentNullException(nameof(value));

            return new MyOpportunityInfo
            {
                Id = value.Id,
                OpportunityId = value.OpportunityId,
                OpportunityTitle = value.OpportunityTitle,
                OpportunityType = value.OpportunityType,
                ActionId = value.ActionId,
                Action = value.Action,
                VerificationStatusId = value.VerificationStatusId,
                VerificationStatus = value.VerificationStatus,
                CertificateId = value.CertificateId,
                DateStart = value.DateStart,
                DateEnd = value.DateEnd,
                DateCompleted = value.DateCompleted,
                ZltoReward = value.ZltoReward,
                YomaReward = value.YomaReward
            };
        }
    }
}
