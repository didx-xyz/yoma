namespace Yoma.Core.Domain.Entity.Models
{
  public class UserPreferenceEngagementType
  {
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid EngagementTypeId { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
