namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkInfo
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string? Description { get; set; }

    public Guid StatusId { get; set; }

    public LinkStatus Status { get; set; }

    public string URL { get; set; }

    public string ShortURL { get; set; }

    public string? QRCodeBase64 { get; set; }

    public int? ParticipantLimit { get; set; }

    public int? ParticipantCount { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
