namespace Yoma.Core.Domain.Entity.Models
{
  public class UserLoginHistory
  {
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string ClientId { get; set; }

    public string? IpAddress { get; set; }

    public string? AuthMethod { get; set; }

    public string? AuthType { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
