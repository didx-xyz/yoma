namespace Yoma.Core.Domain.Entity.Models
{
  public abstract class UserRequestBase
  {
    public string? Email { get; set; }

    public string? DisplayName { get; set; }

    public Guid? EducationId { get; set; }

    public Guid? GenderId { get; set; }

    public DateTimeOffset? DateOfBirth { get; set; }
  }
}
