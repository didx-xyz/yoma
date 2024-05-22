using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class Opportunity
  {
    public Guid Id { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public Guid TypeId { get; set; }

    public string Type { get; set; }

    public Guid OrganizationId { get; set; }

    public string OrganizationName { get; set; }

    public Guid? OrganizationLogoId { get; set; }

    [JsonIgnore]
    public StorageType? OrganizationLogoStorageType { get; set; }

    [JsonIgnore]
    public string? OrganizationLogoKey { get; set; }

    public string? OrganizationLogoURL { get; set; }

    public Guid OrganizationStatusId { get; set; }

    public OrganizationStatus OrganizationStatus { get; set; }

    public string? Summary { get; set; }

    public string? Instructions { get; set; }

    public string? URL { get; set; }

    public decimal? ZltoReward { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? YomaReward { get; set; }

    public decimal? YomaRewardPool { get; set; }

    public decimal? YomaRewardCumulative { get; set; }

    public bool VerificationEnabled { get; set; }

    [JsonIgnore]
    public string? VerificationMethodValue { get; set; }

    public VerificationMethod? VerificationMethod { get; set; }

    public Guid DifficultyId { get; set; }

    public string Difficulty { get; set; }

    public Guid CommitmentIntervalId { get; set; }

    public string CommitmentInterval { get; set; }

    public short CommitmentIntervalCount { get; set; }

    public string CommitmentIntervalDescription { get; set; }

    public int? ParticipantLimit { get; set; }

    public int? ParticipantCount { get; set; }

    public Guid StatusId { get; set; }

    public Status Status { get; set; }

    [JsonIgnore]
    public string? KeywordsFlatten { get; set; }

    public List<string>? Keywords { get; set; }

    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public bool CredentialIssuanceEnabled { get; set; }

    public string? SSISchemaName { get; set; }

    public bool? Featured { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public Guid CreatedByUserId { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public Guid ModifiedByUserId { get; set; }

    public bool Published { get; set; }

    public List<Lookups.OpportunityCategory>? Categories { get; set; }

    public List<Country>? Countries { get; set; }

    public List<Language>? Languages { get; set; }

    public List<Skill>? Skills { get; set; }

    public List<Lookups.OpportunityVerificationType>? VerificationTypes { get; set; }
  }
}
