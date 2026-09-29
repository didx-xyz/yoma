using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

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

    /// <summary>
    /// Informational provider; does not change the owning organisation or its permissions.
    /// </summary>
    public string? Provider { get; set; }

    /// <summary>
    /// Whether any incentive is offered. Null means not specified, not unpaid.
    /// </summary>
    public bool? Incentivized { get; set; }

    /// <summary>
    /// Distinguishes Yoma ZLTO rewards from informational partner incentives.
    /// </summary>
    public RewardType RewardType { get; set; }

    /// <summary>
    /// Informational partner-funded amount; Yoma does not process this payment.
    /// </summary>
    public decimal? PartnerIncentiveAmount { get; set; }

    /// <summary>
    /// ISO 4217 currency code for the partner incentive. Not a ZLTO currency.
    /// </summary>
    public string? PartnerIncentiveCurrency { get; set; }

    /// <summary>
    /// Declared accessibility support; available accommodations describe the supported needs.
    /// </summary>
    public AccessibilitySupport? AccessibilitySupport { get; set; }

    /// <summary>
    /// Description required only when the Other accommodation is selected.
    /// </summary>
    public string? AccommodationOtherDescription { get; set; }

    /// <summary>
    /// Inclusive minimum age checked only on submission for verification using self-declared birth date.
    /// Browsing and finalization are not age-gated. Partner-reported verifications remain authoritative.
    /// </summary>
    public short? AgeFrom { get; set; }

    /// <summary>
    /// Inclusive maximum age; a missing birth date does not block participation.
    /// </summary>
    public short? AgeTo { get; set; }

    public List<Guid>? Accommodations { get; set; }

    public List<Guid>? TargetedGroups { get; set; }

    public List<Guid>? SustainableDevelopmentGoals { get; set; }

    public decimal? ZltoReward { get; set; }

    public decimal? ZltoRewardPool { get; set; }

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

    /// <summary>
    /// Full name of the credential schema selected for the opportunity.
    /// </summary>
    public string? SSISchemaName { get; set; }

    public Guid? EngagementTypeId { get; set; }

    public bool? ShareWithPartners { get; set; }

    public bool? Hidden { get; set; }

    public string? ExternalId { get; set; }

    public List<Guid> Categories { get; set; } = null!;

    /// <summary>
    /// Selected countries and their optional location details, one entry per country.
    /// Omitted details are cleared.
    /// </summary>
    public List<OpportunityRequestCountry> Countries { get; set; } = null!;

    public List<Guid> Languages { get; set; } = null!;

    public List<Guid>? Skills { get; set; }

    public List<OpportunityRequestVerificationType>? VerificationTypes { get; set; }

    public List<CustomFieldValueRequest>? CustomFields { get; set; }

    public virtual void NormalizeForHashing()
    {
      SanitizeCollections();

      Accommodations = Accommodations?.OrderBy(o => o).ToList();
      TargetedGroups = TargetedGroups?.OrderBy(o => o).ToList();
      SustainableDevelopmentGoals = SustainableDevelopmentGoals?.OrderBy(o => o).ToList();
      Keywords = Keywords?.OrderBy(o => o, StringComparer.Ordinal).ToList();
      Categories = [.. Categories.OrderBy(o => o)];
      Countries = [.. Countries.OrderBy(o => o?.CountryId)];
      Languages = [.. Languages.OrderBy(o => o)];
      Skills = Skills?.OrderBy(o => o).ToList();
      VerificationTypes = VerificationTypes?.OrderBy(o => o.Type).ThenBy(o => o.Description, StringComparer.Ordinal).ToList();
      CustomFields.NormalizeForHashing();
    }

    public virtual void SanitizeCollections()
    {
      Accommodations = Accommodations?.Distinct().ToList();
      TargetedGroups = TargetedGroups?.Distinct().ToList();
      SustainableDevelopmentGoals = SustainableDevelopmentGoals?.Distinct().ToList();
      Keywords = Keywords?.Distinct(StringComparer.Ordinal).ToList();
      if (Keywords?.Count == 0) Keywords = null;

      Categories = [.. Categories.Distinct()];
      // Duplicate country entries are rejected by validation rather than silently losing location data.
      Languages = [.. Languages.Distinct()];

      Skills = Skills?.Distinct().ToList();
      if (Skills?.Count == 0) Skills = null;

      VerificationTypes = VerificationTypes?.DistinctBy(o => new { o.Type, o.Description }).ToList();
      if (VerificationTypes?.Count == 0) VerificationTypes = null;

      // Preserve duplicate keys so validation can reject ambiguous values.
      if (CustomFields?.Count == 0) CustomFields = null;
    }
  }
}
