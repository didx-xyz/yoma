using Microsoft.AspNetCore.Http;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
    public class MyOpportunitySearchResultsVerificationFilesAdmin
    {
        public string OpportunityTitle { get; set; }

        public int? TotalCount { get; set; }

        public List<IFormFile>? Files { get; set; }
    }
}
