namespace Yoma.Core.Domain.Entity.Models
{
  public class UserPreferenceAccessibilityRequirement
  {
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid AccessibilityId { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
