namespace Yoma.Core.Domain.Entity.Models
{
  public class UserProfile
  {
    public Guid Id { get; set; }

    public string Username { get; set; }

    public string? Email { get; set; }

    public bool? EmailConfirmed { get; set; }

    public string? FirstName { get; set; }

    public string? Surname { get; set; }

    public string? DisplayName { get; set; }

    public string? PhoneNumber { get; set; }

    public bool? PhoneNumberConfirmed { get; set; }

    public Guid? CountryId { get; set; }

    public Guid? EducationId { get; set; }

    public Guid? GenderId { get; set; }

    public DateTimeOffset? DateOfBirth { get; set; }

    public Guid? PhotoId { get; set; }

    public string? PhotoURL { get; set; }

    public DateTimeOffset? DateLastLogin { get; set; }

    public bool? YoIDOnboarded { get; set; }

    public DateTimeOffset? DateYoIDOnboarded { get; set; }

    public SettingsInfo? Settings { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public List<OrganizationInfo> AdminsOf { get; set; }

    public UserProfileZlto Zlto { get; set; }

    public int OpportunityCountSaved { get; set; }

    public int OpportunityCountPending { get; set; }

    public int OpportunityCountCompleted { get; set; }

    public int OpportunityCountRejected { get; set; }
  }
}
