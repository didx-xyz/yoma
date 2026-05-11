using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public abstract class OpportunityRequestBase : IHashableObject
  {
    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public Guid TypeId { get; set; }

    public Guid OrganizationId { get; set; }

    public string? Summary { get; set; }

    public string? Instructions { get; set; }

    public string? URL { get; set; }

    public decimal? ZltoReward { get; set; }

    public decimal? YomaReward { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    public decimal? YomaRewardPool { get; set; }

    public bool VerificationEnabled { get; set; }

    public VerificationMethod? VerificationMethod { get; set; }

    public Guid? DifficultyId { get; set; }

    public Guid? CommitmentIntervalId { get; set; }

    public short? CommitmentIntervalCount { get; set; }

    public int? ParticipantLimit { get; set; }

    public List<string>? Keywords { get; set; }

    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public bool CredentialIssuanceEnabled { get; set; }

    public string? SSISchemaName { get; set; }

    public Guid? EngagementTypeId { get; set; }

    public bool? ShareWithPartners { get; set; }

    public bool? Hidden { get; set; }

    [JsonIgnore]
    internal string? ExternalId { get; set; }

    public List<Guid> Categories { get; set; } = null!;

    public List<Guid> Countries { get; set; } = null!;

    public List<Guid> Languages { get; set; } = null!;

    public List<Guid>? Skills { get; set; }

    public List<OpportunityRequestVerificationType>? VerificationTypes { get; set; }

    public virtual void NormalizeForHashing()
    {
      SanitizeCollections();

      Keywords = Keywords?.OrderBy(o => o, StringComparer.Ordinal).ToList();
      Categories = [.. Categories.OrderBy(o => o)];
      Countries = [.. Countries.OrderBy(o => o)];
      Languages = [.. Languages.OrderBy(o => o)];
      Skills = Skills?.OrderBy(o => o).ToList();
      VerificationTypes = VerificationTypes?.OrderBy(o => o.Type).ThenBy(o => o.Description, StringComparer.Ordinal).ToList();
    }

    public virtual void SanitizeCollections()
    {
      Keywords = Keywords?.Distinct(StringComparer.Ordinal).ToList();
      if (Keywords?.Count == 0) Keywords = null;

      Categories = [.. Categories.Distinct()];
      Countries = [.. Countries.Distinct()];
      Languages = [.. Languages.Distinct()];

      Skills = Skills?.Distinct().ToList();
      if (Skills?.Count == 0) Skills = null;

      VerificationTypes = VerificationTypes?.DistinctBy(o => new { o.Type, o.Description }).ToList();
      if (VerificationTypes?.Count == 0) VerificationTypes = null;
    }
  }
}
