namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkRequestUpdateStatus
  {
    public LinkStatus Status { get; set; }

    public string? Comment { get; set; } //applies to approval and required with decline
  }
}
