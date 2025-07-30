namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkSearchResultsUsageItem
  {
    public Guid? UserId { get; set; }

    public string Username { get; set; }

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public string? DisplayName { get; set; }

    public string? Country { get; set; }

    public int? Age { get; set; }

    public bool Claimed => DateClaimed.HasValue;

    public DateTimeOffset? DateClaimed { get; set; }
  }
}
