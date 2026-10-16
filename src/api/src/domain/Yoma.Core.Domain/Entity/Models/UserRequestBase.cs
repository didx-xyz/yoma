using Newtonsoft.Json;

namespace Yoma.Core.Domain.Entity.Models
{
  public abstract class UserRequestBase
  {
    public string? Email { get; set; }

    // Always derived from FirstName + Surname, no longer accepted from API clients (see UserExtensions.SetDisplayName)
    [JsonIgnore]
    internal string? DisplayName { get; set; }

    public string? Region { get; set; }

    public string? City { get; set; }

    /// <summary>
    /// Optional city centre as [longitude, latitude], without elevation.
    /// </summary>
    public double[]? Coordinates { get; set; }

    public Core.LocationSource? LocationSource { get; set; }

    public Guid? EducationId { get; set; }

    public Guid? GenderId { get; set; }

    public DateTimeOffset? DateOfBirth { get; set; }
  }
}
