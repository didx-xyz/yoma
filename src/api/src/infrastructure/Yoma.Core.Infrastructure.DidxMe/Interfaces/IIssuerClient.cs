using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Interfaces
{
  public interface IIssuerClient
  {
    Task<CredentialPreset?> CreatePresetOrNull(string code, string name, Dictionary<string, CredentialAttribute> attributes);

    Task<CredentialPreset> GetPreset(string id);

    Task<IssuanceResponse> Issue(string presetId, Dictionary<string, string> attributes);

    Task<IssuanceResponse> GetIssuance(string id);

    Task RevokeCredential(string id);

    Task Deliver(string externalId, string offerUri);

    Task<Holder?> GetHolderOrNull(string externalId);

    Task CreateHolder(string externalId, string username, string? firstName, string? lastName);

    Task EnableHolderLink(string username);
  }
}
