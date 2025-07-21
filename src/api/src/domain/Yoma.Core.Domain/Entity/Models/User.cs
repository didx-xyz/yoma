using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;

namespace Yoma.Core.Domain.Entity.Models
{
  public class User
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

    public string? Country { get; set; }

    public Guid? EducationId { get; set; }

    public string? Education { get; set; }

    public Guid? GenderId { get; set; }

    public string? Gender { get; set; }

    public DateTimeOffset? DateOfBirth { get; set; }

    public Guid? PhotoId { get; set; }

    [JsonIgnore]
    public StorageType? PhotoStorageType { get; set; }

    [JsonIgnore]
    public string? PhotoKey { get; set; }

    public string? PhotoURL { get; set; }

    public DateTimeOffset? DateLastLogin { get; set; }

    public Guid? ExternalId { get; set; }

    public bool? YoIDOnboarded { get; set; }

    public DateTimeOffset? DateYoIDOnboarded { get; set; }

    [JsonIgnore]
    public string? SettingsRaw { get; set; }

    public SettingsInfo? Settings { get; set; }

    public bool? ExternalIdpLinked { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public List<UserSkillInfo>? Skills { get; set; }
  }
}
