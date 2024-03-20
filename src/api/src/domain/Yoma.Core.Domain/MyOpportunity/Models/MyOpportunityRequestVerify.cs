using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityRequestVerify
  {
    public IFormFile? Certificate { get; set; }

    public IFormFile? VoiceNote { get; set; }

    public IFormFile? Picture { get; set; }

    public Geometry? Geometry { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }
  }
}
