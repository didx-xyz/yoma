using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
    public class MyOpportunityInfoVerification
    {
        public VerificationType VerificationType { get; set; }

        public Geometry? Geometry { get; set; }

        public Guid? FileId { get; set; }

        public string? FileURL { get; set; }
    }
}
