using Yoma.Core.Domain.SSI;

namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  /// <summary>
  /// Bridges an immutable Yoma domain schema/version to a didx:me preset and credential type (vct).
  /// didx:me owns the preset definition and associated managed template; this record retains the
  /// domain identity and compatibility metadata required by the existing SSI interfaces/processes.
  /// Keep that boundary while Aries fallback is required. Removing it is a future domain redesign,
  /// not part of selecting this infrastructure provider.
  /// </summary>
  public class CredentialPresetMapping
  {
    /// <summary>
    /// Stable mapping identity returned as Schema.Id through Yoma's domain interface.
    /// PresetId is the separate didx:me resource identifier.
    /// </summary>
    public string Id { get; set; } = null!;

    public string TenantAlias { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Version { get; set; } = null!;

    /// <summary>
    /// Actual credential format carried through domain scheduling and wallet responses.
    /// This provider accepts SDJWT only; ACR and JWS belong to the Aries infrastructure.
    /// </summary>
    public ArtifactType ArtifactType { get; set; }

    /// <summary>
    /// Snapshot of this version's domain attribute names for schema projection and wallet parsing.
    /// This is compatibility metadata, not a separately editable credential definition. Provider-only
    /// correlation claims are excluded; didx:me owns the preset's complete attribute definition.
    /// </summary>
    public string AttributeNames { get; set; } = null!;

    public string PresetId { get; set; } = null!;

    public string Vct { get; set; } = null!;

    public DateTimeOffset DateCreated { get; set; }
  }
}
