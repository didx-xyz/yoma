namespace Yoma.Core.Domain.Entity.Models
{
  public abstract class UserRequestProfileBase : UserRequestBase
  {
    public string FirstName { get; set; } = null!;

    public string Surname { get; set; } = null!;

    public string? Region { get; set; }

    public string? City { get; set; }

    /// <summary>Optional city centre as [longitude, latitude], without elevation.</summary>
    public double[]? Coordinates { get; set; }

    public Core.LocationSource? LocationSource { get; set; }
  }
}
