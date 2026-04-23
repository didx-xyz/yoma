namespace Yoma.Core.Domain.Core.Extensions
{
  public static class DictionaryExtensions
  {
    public static T? Get<T>(this IReadOnlyDictionary<string, object?> source, string key)
    {
      ArgumentNullException.ThrowIfNull(source);
      ArgumentException.ThrowIfNullOrWhiteSpace(key);

      if (!source.TryGetValue(key, out var value))
        throw new KeyNotFoundException($"Key '{key}' was not found");

      // Handle null explicitly so we never throw NullReferenceException
      if (value is null)
      {
        if (default(T) is null)
          return default;

        throw new InvalidOperationException(
            $"The value for key '{key}' is null but '{typeof(T).Name}' does not allow null");
      }

      if (value is T typed)
        return typed;

      throw new InvalidCastException(
          $"The value for key '{key}' is of type '{value.GetType().FullName}', but '{typeof(T).FullName}' was requested");
    }
  }
}
