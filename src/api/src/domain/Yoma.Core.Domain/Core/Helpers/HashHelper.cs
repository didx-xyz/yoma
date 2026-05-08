using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class HashHelper
  {
    #region Class Varriables
    private static readonly IContractResolver _contractResolver = new DefaultContractResolver();

    // Explicit serializer settings keep hash generation stable and predictable.
    // Hashes may be persisted and compared later, so formatting, culture, date handling,
    // type metadata, null/default handling, or future Json.NET default changes must not
    // unintentionally alter the generated hash.
    private static readonly JsonSerializerSettings _settings = new()
    {
      ContractResolver = _contractResolver,
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
    /// Computes a SHA-256 hash from the serializable top-level properties defined by the declared contract type.
    /// The runtime type is intentionally not used for the root object, allowing callers to hash against a specific contract type.
    /// The object must implement <see cref="IHashableObject"/> so it can normalize itself into a deterministic state before hashing.
    /// Top-level property ordering is normalized by this helper.
    /// </summary>
    public static string ComputeSHA256Hash<T>(T instance) where T : class, IHashableObject
    {
      ArgumentNullException.ThrowIfNull(instance, nameof(instance));

      instance.NormalizeForHashing();

      var payload = new Dictionary<string, object?>(StringComparer.Ordinal);

      foreach (var property in HashContract<T>.Properties)
      {
        if (property.ValueProvider == null) continue;
        payload[property.PropertyName!] = property.ValueProvider.GetValue(instance);
      }

      var jsonString = JsonConvert.SerializeObject(payload, _settings);

      return ComputeSHA256Hash(jsonString);
    }

    public static string ComputeSHA256Hash(string input)
    {
      var bytes = Encoding.UTF8.GetBytes(input);
      var hash = SHA256.HashData(bytes);

      // Convert the byte array to a hexadecimal string
      var builder = new StringBuilder();
      for (int i = 0; i < hash.Length; i++)
        builder.Append(hash[i].ToString("x2"));

      return builder.ToString();
    }
    #endregion

    #region Private Members
    // Cached in process memory once per closed generic contract type.
    // Static generic initialization is thread-safe and avoids a runtime dictionary lookup.
    // Property order is fixed to keep the serialized hash payload stable.
    private static class HashContract<T> where T : class
    {
      public static readonly JsonProperty[] Properties = [.. ((JsonObjectContract)_contractResolver.ResolveContract(typeof(T))).Properties
        .Where(property => !property.Ignored && property.Readable)
        .OrderBy(property => property.PropertyName, StringComparer.Ordinal)];
    }
    #endregion
  }
}
