namespace Yoma.Core.Domain.Entity.Models
{
  public class UserPreferenceCategory
  {
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid CategoryId { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
