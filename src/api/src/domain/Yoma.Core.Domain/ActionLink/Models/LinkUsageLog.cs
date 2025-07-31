namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkUsageLog
  {
    public Guid Id { get; set; }

    public Guid LinkId { get; set; }

    public Guid UserId { get; set; }

    public string Username { get; set; }

    public string? UserEmail { get; set; }

    public string? UserDisplayName { get; set; }

    public string? UserPhoneNumber { get; set; }

    public string? UserCountry { get; set; }

    public DateTimeOffset? UserDateOfBirth { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
