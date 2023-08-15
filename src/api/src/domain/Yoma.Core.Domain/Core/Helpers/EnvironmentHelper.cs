namespace Yoma.Core.Domain.Core.Helpers
{
  public class EnvironmentHelper
  {
    public static Environment FromString(string? environment)
    {
      environment = environment?.Trim();
      if (string.IsNullOrEmpty(environment))
        throw new ArgumentNullException(nameof(environment));

      var ret = Environment.None;
      if (!Enum.TryParse(environment, true, out ret) || ret == Environment.None)
        throw new ArgumentException($"Environment of '{environment}' not supported", nameof(environment));

      return ret;
    }
  }
}
