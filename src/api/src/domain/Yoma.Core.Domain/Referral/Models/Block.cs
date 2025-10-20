namespace Yoma.Core.Domain.Referral.Models
{
  public class Block
  {
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid ReasonId { get; set; }

    public string Reason { get; set; } = null!;

    public string ReasonDescription { get; set; } = null!;

    public string? CommentBlock { get; set; }

    public string? CommentUnBlock { get; set; }

    public bool Active { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public Guid CreatedByUserId { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public Guid ModifiedByUserId { get; set; }
  }
}
