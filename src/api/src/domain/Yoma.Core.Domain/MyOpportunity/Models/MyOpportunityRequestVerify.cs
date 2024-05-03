using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
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

    [JsonIgnore]
    internal bool OverridePending { get; set; }

    [JsonIgnore]
    internal bool InstantVerification { get; set; }
  }
}
