using Newtonsoft.Json;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class HashHelper
  {
    #region Class Variables
    // Explicit serializer settings keep hash generation stable and predictable.
    // Hashes may be persisted and compared later, so formatting, culture, date handling,
    // type metadata, null/default handling, or future Json.NET default changes must not
    // unintentionally alter the generated hash.
    private static readonly JsonSerializerSettings _settings = new()
    {
      Formatting = Formatting.None,
      NullValueHandling = NullValueHandling.Include,
      DefaultValueHandling = DefaultValueHandling.Include,
      TypeNameHandling = TypeNameHandling.None,
      DateFormatHandling = DateFormatHandling.IsoDateFormat,
      DateTimeZoneHandling = DateTimeZoneHandling.RoundtripKind,
      Culture = CultureInfo.InvariantCulture
    };
    #endregion

    #region Public Members
    /// <summary>
    /// Computes a SHA-256 hash for the supplied object using its concrete type.
    /// The object must implement <see cref="IHashableObject"/> so it can normalize itself into a deterministic state before hashing.
    /// </summary>
    public static string ComputeSHA256Hash<T>(T instance) where T : class, IHashableObject
    {
      ArgumentNullException.ThrowIfNull(instance, nameof(instance));

      var runtimeType = instance.GetType();
      var declaredType = typeof(T);

      if (runtimeType != declaredType)
        throw new ArgumentException($"Hash type mismatch. Declared type '{declaredType.FullName}' must match runtime type '{runtimeType.FullName}'. Hash the concrete type to avoid accidental base-contract hashing.", nameof(instance));

      instance.NormalizeForHashing();

      var jsonString = JsonConvert.SerializeObject(instance, _settings);

      return ComputeSHA256Hash(jsonString);
    }

    public static string ComputeSHA256Hash(string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      var bytes = Encoding.UTF8.GetBytes(input);
      var hash = SHA256.HashData(bytes);

      var builder = new StringBuilder();
      for (var i = 0; i < hash.Length; i++)
        builder.Append(hash[i].ToString("x2"));

      return builder.ToString();
    }

    public static string SerializeForHashing(object instance)
    {
      ArgumentNullException.ThrowIfNull(instance, nameof(instance));

      return JsonConvert.SerializeObject(instance, _settings);
    }
    #endregion
  }
}
