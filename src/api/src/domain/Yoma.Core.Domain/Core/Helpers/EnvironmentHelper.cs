namespace Yoma.Core.Domain.Core.Helpers
{
  public static class EnvironmentHelper
  {
    public static Environment FromString(string? environment)
    {
      environment = environment?.Trim();
      if (string.IsNullOrEmpty(environment))
        throw new ArgumentNullException(nameof(environment));

      if (!Enum.TryParse(environment, true, out Environment ret) || ret == Environment.None)
        throw new ArgumentException($"Environment of '{environment}' not supported", nameof(environment));

      return ret;
    }
  }
}
