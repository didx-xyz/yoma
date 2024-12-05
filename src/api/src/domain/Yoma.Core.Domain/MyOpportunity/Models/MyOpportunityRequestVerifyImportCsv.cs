using Microsoft.AspNetCore.Http;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityRequestVerifyImportCsv
  {
    public IFormFile File { get; set; }

    public Guid OrganizationId { get; set; }

    public string? Comment { get; set; }
  }
}
