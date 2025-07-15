using Aries.CloudAPI.DotnetSDK.AspCore.Clients.Models;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.SSI;

namespace Yoma.Core.Infrastructure.AriesCloud.Extensions
{
  public static class SchemaExtensions
  {
    #region Public Members
    //TODO: Requested type to be included on CredentialSchema in acapy
    public static List<Domain.SSI.Models.Provider.Schema>? ToSchema(this ICollection<CredentialSchema> schemas, bool latestVersion)
    {
      if (schemas.Count == 0) return null;

      var results = schemas.Select(ToSchema).ToList();

      results = FilterByLatestVersion(latestVersion, results);

      return results;
    }

    //TODO: Requested type to be included on CredentialSchema in acapy
    public static Domain.SSI.Models.Provider.Schema ToSchema(this CredentialSchema o)
    {
      return new Domain.SSI.Models.Provider.Schema
      {
        Id = o.Id,
        Name = o.Name,
        Version = Version.Parse(o.Version).ToMajorMinor(),
        ArtifactType = ArtifactType.ACR,
        AttributeNames = o.Attribute_names
      };
    }

    public static List<Domain.SSI.Models.Provider.Schema>? ToSchema(this ICollection<Models.CredentialSchema> schemas, bool latestVersion)
    {
      if (schemas.Count == 0) return null;

      var results = schemas.Select(ToSchema).ToList();

      results = FilterByLatestVersion(latestVersion, results);

      return results;
    }

    public static Domain.SSI.Models.Provider.Schema ToSchema(this Models.CredentialSchema o)
    {
      return new Domain.SSI.Models.Provider.Schema
      {
        Id = o.Id,
        Name = o.Name,
        Version = Version.Parse(o.Version).ToMajorMinor(),
        ArtifactType = o.ArtifactType,
        AttributeNames = JsonConvert.DeserializeObject<ICollection<string>>(o.AttributeNames) ?? [],
      };
    }


    public static Domain.SSI.Models.Provider.Credential ToCredential(this CredInfo o)
    {
      return new Domain.SSI.Models.Provider.Credential
      {
        Id = o.Credential_id,
        SchemaId = o.Schema_id,
        Attributes = o.Attrs
      };
    }

    public static Domain.SSI.Models.Provider.Credential ToCredential(this Models.Credential o)
    {
      return new Domain.SSI.Models.Provider.Credential
      {
        Id = o.Id.ToString(),
        SchemaId = o.SchemaId,
        Attributes = JsonConvert.DeserializeObject<Dictionary<string, string>>(o.Attributes) ?? []
      };
    }
    #endregion

    #region Private Members
    private static List<Domain.SSI.Models.Provider.Schema> FilterByLatestVersion(bool latestVersion, List<Domain.SSI.Models.Provider.Schema> results)
    {
      if (latestVersion)
        results = [.. results
          .GroupBy(s => s.Name)
          .Select(group => group.OrderByDescending(s => s.Version).First())];
      return results;
    }
    #endregion
  }
}
