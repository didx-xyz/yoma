using Microsoft.AspNetCore.Http;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
    public class MyOpportunityVerifyRequest
    {
        public IFormFile Certificate { get; set; }

        public DateTimeOffset? DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }
    }
}
