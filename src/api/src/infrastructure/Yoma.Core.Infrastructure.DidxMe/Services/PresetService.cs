using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Security.Cryptography;
using System.Text;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.DidxMe.Client;
using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Services
{
  /// <summary>
  /// Uses didx:me presets for each immutable Yoma credential version. Issuance references the preset;
  /// didx:me creates or reuses its associated managed template for the configured issuer project.
  /// Yoma does not manage a separate template lifecycle or AnonCreds credential definitions.
  /// Domain Schema DTOs are projections at the existing SSI boundary, retained for Aries fallback.
  /// </summary>
  public class PresetService
  {
    #region Class Variables
    private const int AttributeName_MaxLength = 50;

    private readonly ProviderOptions _options;
    private readonly IRepository<CredentialPresetMapping> _repository;
    private readonly IssuerClient _issuerClient;

    // Infrastructure-only signed correlation. Never presented as a domain schema attribute.
    internal const string CredentialIdAttribute = "_Yoma_Credential_ID";
    #endregion

    #region Constructor
    public PresetService(
      IOptions<ProviderOptions> options,
      IRepository<CredentialPresetMapping> repository,
      IssuerClient issuerClient)
    {
      ArgumentNullException.ThrowIfNull(options, nameof(options));

      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _repository = repository ?? throw new ArgumentNullException(nameof(repository));
      _issuerClient = issuerClient ?? throw new ArgumentNullException(nameof(issuerClient));
    }
    #endregion

    #region Public Members
    public List<Schema> ListDomainSchemas(bool latestVersion)
    {
      var schemas = _repository.Query()
        .Where(item => item.TenantAlias == _options.TenantAlias)
        .ToList()
        .Select(ToDomainSchema);

      if (latestVersion)
        schemas = schemas
          .GroupBy(item => item.Name)
          .Select(group => group.OrderByDescending(item => item.Version).First());

      return schemas
        .OrderBy(item => item.Name)
        .ThenBy(item => item.Version)
        .ToList();
    }

    public CredentialPresetMapping? GetMappingOrNull(string id)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(id);

      return _repository.Query()
        .SingleOrDefault(item => item.TenantAlias == _options.TenantAlias && item.Id == id);
    }

    public CredentialPresetMapping GetMapping(string id) =>
      GetMappingOrNull(id) ?? throw new EntityNotFoundException("The didx:me preset mapping does not exist");

    public CredentialPresetMapping? GetMappingByVctOrNull(string vct) =>
      _repository.Query()
        .SingleOrDefault(item => item.TenantAlias == _options.TenantAlias && item.Vct == vct);

    public async Task<Schema> UpsertPreset(SchemaRequest request)
    {
      ArgumentNullException.ThrowIfNull(request);
      ArgumentException.ThrowIfNullOrWhiteSpace(request.Name);
      ArgumentException.ThrowIfNullOrWhiteSpace(_options.TenantAlias);
      ValidateArtifactType(request.ArtifactType);

      if (request.Attributes == null || request.Attributes.Count == 0 || request.Attributes.Any(string.IsNullOrWhiteSpace))
        throw new ArgumentException("Schema attributes are required", nameof(request));

      var attributes = request.Attributes.Distinct(StringComparer.Ordinal).ToList();
      // Paradym limits complete attribute keys, including prefixes. Check every source here for
      // both seeded and admin-created presets, before any remote creation or local mapping write.
      var invalidAttribute = attributes.FirstOrDefault(attribute => attribute.Length > AttributeName_MaxLength);
      if (invalidAttribute != null)
        throw new ArgumentException(
          $"Credential attribute name '{invalidAttribute}' is {invalidAttribute.Length} characters; the maximum is {AttributeName_MaxLength}, including any prefix and underscore", nameof(request));

      if (attributes.Contains(CredentialIdAttribute, StringComparer.OrdinalIgnoreCase))
        throw new ArgumentException("The schema contains a reserved infrastructure attribute", nameof(request));

      var name = request.Name.Trim();
      var existing = ListDomainSchemas(true).SingleOrDefault(item => item.Name == name);
      var version = existing?.Version.IncrementMinor() ?? VersionExtensions.Default;
      var hash = Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(
        JsonConvert.SerializeObject(new[] { _options.TenantAlias, name, version.ToString() }))));
      var code = $"yoma-{hash[..40]}";
      var presetId = $"~{_options.TenantAlias}:{code}";

      // The domain has already serialized lists/dates and supplies optional-value semantics.
      // Preserve those strings exactly; optional domain attributes must remain omittable.
      var definitions = attributes.ToDictionary(attribute => attribute,
        attribute => new CredentialAttribute { Name = attribute });
      definitions.Add(CredentialIdAttribute, new CredentialAttribute
      {
        Name = CredentialIdAttribute,
        Required = true
      });

      // A previous remote create may have succeeded before this database saved its mapping.
      // Expected conflicts are normal responses. Always validate the immutable preset before reuse.
      var preset = await _issuerClient.CreatePresetOrNull(code, name, definitions)
        ?? await _issuerClient.GetPreset(presetId);

      if (preset.Id != presetId || preset.Author != _options.TenantAlias || preset.Code != code ||
        preset.CredentialFormat != "sd-jwt" || preset.TemplateName != name ||
        string.IsNullOrWhiteSpace(preset.TemplateType) || preset.TemplateAttributes == null ||
        preset.TemplateAttributes.Count != definitions.Count || definitions.Any(pair =>
          !preset.TemplateAttributes.TryGetValue(pair.Key, out var definition) || definition.Type != "string" ||
          definition.Required != pair.Value.Required || definition.AlwaysDisclosed))
        throw new InvalidOperationException("The didx:me preset does not match the requested immutable schema");

      var mapping = await _repository.Create(new CredentialPresetMapping
      {
        Id = $"didxme:{hash}",
        TenantAlias = _options.TenantAlias,
        Name = name,
        Version = version.ToString(),
        ArtifactType = request.ArtifactType,
        AttributeNames = JsonConvert.SerializeObject(attributes),
        PresetId = preset.Id,
        Vct = preset.TemplateType
      });

      return ToDomainSchema(mapping);
    }

    public static Schema ToDomainSchema(CredentialPresetMapping mapping) => new()
    {
      Id = mapping.Id,
      Name = mapping.Name,
      Version = Version.Parse(mapping.Version),
      ArtifactType = mapping.ArtifactType,
      AttributeNames = JsonConvert.DeserializeObject<List<string>>(mapping.AttributeNames)
        ?? throw new InvalidOperationException("Preset mapping is missing domain attribute names")
    };

    public static void ValidateArtifactType(ArtifactType artifactType)
    {
      switch (artifactType)
      {
        case ArtifactType.SDJWT:
          return;
        default:
          throw new NotSupportedException($"Artifact type '{artifactType}' is not supported by didx:me; expected SDJWT");
      }
    }
    #endregion
  }
}
