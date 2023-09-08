using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
    public class MyOpportunityRequestVerify
    {
        [FromForm]
        public List<MyOpportunityRequestVerifyItem> Items { get; set; } 

        public DateTimeOffset? DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }
    }

    public class MyOpportunityRequestVerifyItem
    {
        public Guid VerificationTypeId { get; set; }

        [FromForm]
        public IFormFile? File { get; set; }

        public Geometry? Geometry { get; set; } 
    }
}
