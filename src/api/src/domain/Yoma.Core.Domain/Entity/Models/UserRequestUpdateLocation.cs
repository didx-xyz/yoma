namespace Yoma.Core.Domain.Entity.Models
{
  /// <summary>Updates the profile country and replaces its optional Yoma-only location details.</summary>
  public class UserRequestUpdateLocation
  {
    public Guid CountryId { get; set; }

    public string? Region { get; set; }

    public string? City { get; set; }

    /// <summary>City centre as [longitude, latitude], without elevation.</summary>
    public double[]? Coordinates { get; set; }

    public Core.LocationSource? LocationSource { get; set; }
  }
}
