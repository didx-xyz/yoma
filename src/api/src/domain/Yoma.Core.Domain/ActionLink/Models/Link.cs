namespace Yoma.Core.Domain.ActionLink.Models
{
  public class Link
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string EntityType { get; set; } = null!;

    public string Action { get; set; } = null!;

    public Guid StatusId { get; set; }

    public ActionLinkStatus Status { get; set; }

    public Guid? OpportunityId { get; set; }

    public string? OpportunityTitle { get; set; }

    public Guid? OpportunityOrganizationId { get; set; }

    public string? OpportunityOrganizationName { get; set; }

    public string URL { get; set; } = null!;

    public string ShortURL { get; set; } = null!;

    public int? UsagesLimit { get; set; }

    public int? UsagesTotal { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public string? DistributionList { get; set; }

    public bool? LockToDistributionList { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public Guid CreatedByUserId { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public Guid ModifiedByUserId { get; set; }
  }
}
