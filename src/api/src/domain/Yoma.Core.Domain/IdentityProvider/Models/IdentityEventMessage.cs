namespace Yoma.Core.Domain.IdentityProvider.Models
{
  public class IdentityEventMessage
  {
    public IdentityEventType Type { get; set; }

    public User User { get; set; } = null!;
  }
}
