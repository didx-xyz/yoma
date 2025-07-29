namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkInfo
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string? Description { get; set; }

    public LinkEntityType EntityType { get; set; }

    public LinkAction Action { get; set; }

    public Guid StatusId { get; set; }

    public LinkStatus Status { get; set; }

    public Guid EntityId { get; set; }

    public string EntityTitle { get; set; }

    public Guid? EntityOrganizationId { get; set; }

    public string? EntityOrganizationName { get; set; }

    public string URL { get; set; }

    public string ShortURL { get; set; }

    public string? QRCodeBase64 { get; set; }

    public int? UsagesLimit { get; set; }

    public int? UsagesTotal { get; set; }

    public int? UsagesAvailable { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public bool? LockToDistributionList { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
