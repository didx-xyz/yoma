using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
    public class MyOpportunityVerifyRequest
    {
        [Required]
        public IFormFile Certificate { get; set; }

        public DateTimeOffset? DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }
    }
}
