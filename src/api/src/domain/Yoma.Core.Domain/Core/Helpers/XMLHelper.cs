using System.Xml;
using System.Xml.Linq;

namespace Yoma.Core.Domain.Core.Helpers
{
  /// <summary>
  /// XML utilities for secure loading and common operations.
  /// Designed to grow as shared XML needs expand.
  /// </summary>
  public static class XMLHelper
  {
    #region Settings / Constants

    /// <summary>
    /// Secure defaults: DTD prohibited, no external resolver, ignore comments & PIs.
    /// </summary>
    private static XmlReaderSettings CreateSecureSettings() => new()
    {
      DtdProcessing = DtdProcessing.Prohibit,
      XmlResolver = null,
      IgnoreComments = true,
      IgnoreProcessingInstructions = true
    };

    #endregion

    #region Secure Loaders

    /// <summary>Load an XDocument from a stream using secure settings.</summary>
    public static XDocument Load(Stream stream, LoadOptions options = LoadOptions.None)
    {
      ArgumentNullException.ThrowIfNull(stream, nameof(stream));
      using var reader = XmlReader.Create(stream, CreateSecureSettings());
      return XDocument.Load(reader, options);
    }

    /// <summary>Load an XDocument from a TextReader using secure settings.</summary>
    public static XDocument Load(TextReader textReader, LoadOptions options = LoadOptions.None)
    {
      ArgumentNullException.ThrowIfNull(textReader, nameof(textReader));
      using var reader = XmlReader.Create(textReader, CreateSecureSettings());
      return XDocument.Load(reader, options);
    }

    /// <summary>Load an XDocument from a string using secure settings.</summary>
    public static XDocument Load(string xml, LoadOptions options = LoadOptions.None)
    {
      ArgumentNullException.ThrowIfNull(xml, nameof(xml));
      using var sr = new StringReader(xml);
      return Load(sr, options);
    }

    #endregion

    #region Try-Load Variants

    public static bool TryLoad(Stream stream, out XDocument? document, LoadOptions options = LoadOptions.None)
    {
      try { document = Load(stream, options); return true; }
      catch { document = null; return false; }
    }

    public static bool TryLoad(TextReader textReader, out XDocument? document, LoadOptions options = LoadOptions.None)
    {
      try { document = Load(textReader, options); return true; }
      catch { document = null; return false; }
    }

    public static bool TryLoad(string xml, out XDocument? document, LoadOptions options = LoadOptions.None)
    {
      try { document = Load(xml, options); return true; }
      catch { document = null; return false; }
    }

    #endregion

    #region Query Helpers

    /// <summary>
    /// Gets trimmed inner text of the first element with the given name; returns empty if missing.
    /// </summary>
    public static string GetElementText(this XContainer container, XName name, string @default = "")
    {
      if (container is null) return @default;
      var value = container.Element(name)?.Value?.Trim();
      return string.IsNullOrEmpty(value) ? @default : value!;
    }

    /// <summary>
    /// Gets trimmed attribute value by name; returns empty if missing.
    /// </summary>
    public static string GetAttribute(this XElement? element, XName name, string @default = "")
    {
      if (element is null) return @default;
      var value = element.Attribute(name)?.Value?.Trim();
      return string.IsNullOrEmpty(value) ? @default : value!;
    }

    /// <summary>
    /// Tries to parse a child element's text as DateTimeOffset (RFC1123/ISO-8601 etc).
    /// </summary>
    public static bool TryGetElementDate(this XContainer container, XName name, out DateTimeOffset dto)
    {
      dto = default;
      var text = container.GetElementText(name);
      return !string.IsNullOrEmpty(text) && DateTimeOffset.TryParse(text, out dto);
    }

    #endregion

    #region Namespace Utilities (add more as needed)

    /// <summary>
    /// Convenience for getting an XNamespace instance.
    /// </summary>
    public static XNamespace Ns(string uri) => XNamespace.Get(uri);

    #endregion
  }
}
