namespace Yoma.Core.Domain.ActionLink.Models
{
  public class Link
  {
    public Guid Id { get; set; }

    public string Description { get; set; }

    public string EntityType { get; set; }

    public Guid ActionId { get; set; }

    public LinkAction Action { get; set; }

    public Guid StatusId { get; set; }

    public LinkStatus Status { get; set; }

    public Guid? OpportunityId { get; set; }

    public string ShortURL { get; set; }

    public int ParticipantLimit { get; set; }

    public int? ParticipantCount { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public string? DistributionList { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public Guid CreatedByUserId { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public Guid ModifiedByUserId { get; set; }
  }
}
