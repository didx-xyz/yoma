namespace Yoma.Core.Domain.Core.Helpers
{
  public static class RoundingHelper
  {
    /// <summary>
    /// Rounds DOWN to the nearest multiple of the specified factor.
    /// If factor is null, value is returned unchanged.
    /// Factor must be >= 10.
    /// </summary>
    public static int RoundDown(int value, int? factor = null)
    {
      if (factor is null) return value;

      if (factor < 10)
        throw new ArgumentOutOfRangeException(nameof(factor), "Factor must be >= 10.");

      return (value / factor.Value) * factor.Value;
    }

    /// <summary>
    /// Rounds DOWN to the nearest multiple of the specified factor.
    /// If factor is null, value is returned unchanged.
    /// Factor must be >= 10.
    /// </summary>
    public static long RoundDown(long value, long? factor = null)
    {
      if (factor is null) return value;

      if (factor < 10)
        throw new ArgumentOutOfRangeException(nameof(factor), "Factor must be >= 10.");

      return (value / factor.Value) * factor.Value;
    }
  }
}
