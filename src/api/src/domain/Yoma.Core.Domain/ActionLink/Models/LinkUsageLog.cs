namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkUsageLog
  {
    public Guid Id { get; set; }

    public Guid LinkId { get; set; }

    public Guid UserId { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
