using CsvHelper.Configuration.Attributes;
using Newtonsoft.Json;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityInfo
  {
    [Ignore]
    public Guid Id { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public string Type { get; set; }

    [Ignore]
    public Guid OrganizationId { get; set; }

    [Name("Organization Name")]
    public string OrganizationName { get; set; }

    [Ignore]
    public string? OrganizationLogoURL { get; set; }

    public string? Summary { get; set; }

    public string? Instructions { get; set; }

    public string? URL { get; set; }

    [Name("Zlto Reward")]
    public decimal? ZltoReward { get; set; }

    [Ignore] //reserved for future use
    public decimal? YomaReward { get; set; }

    [Name("Verification Enabled")]
    [BooleanFalseValues("No")]
    [BooleanTrueValues("Yes")]
    public bool VerificationEnabled { get; set; }

    [Name("Verification Method")]
    public VerificationMethod? VerificationMethod { get; set; }

    public string Difficulty { get; set; }

    [Ignore]
    public string CommitmentInterval { get; set; }

    [Ignore]
    public short CommitmentIntervalCount { get; set; }

    [Name("Commitment Interval")]
    public string CommitmentIntervalDescription { get; set; }

    [Name("Participant Limit")]
    public int? ParticipantLimit { get; set; }

    [Name("Participant Count Verification Completed")]
    public int ParticipantCountVerificationCompleted { get; set; }

    [Name("Participant Count Verification Pending")]
    public int ParticipantCountVerificationPending { get; set; }

    [Name("Participant Count Total")]
    public int ParticipantCountTotal { get; set; }

    [Name("Participant Limit Reached")]
    [BooleanFalseValues("No")]
    [BooleanTrueValues("Yes")]
    public bool ParticipantLimitReached { get; set; }

    [Ignore]
    public Guid StatusId { get; set; }

    public Status Status { get; set; }

    [Ignore]
    public List<string>? Keywords { get; set; }

    [JsonIgnore]
    [Name("Keywords")]
    public string? KeywordsFlattened => Keywords == null || Keywords.Count == 0 ? null : string.Join(", ", Keywords);

    [Name("Start Date")]
    public DateTimeOffset DateStart { get; set; }

    [Name("End Date")]
    public DateTimeOffset? DateEnd { get; set; }

    [BooleanFalseValues("No")]
    [BooleanTrueValues("Yes")]
    public bool Published { get; set; }

    [Ignore]
    public List<Lookups.OpportunityCategory>? Categories { get; set; }

    [JsonIgnore]
    [Name("Categories")]
    public string? CategoriesFlattened => Categories == null || Categories.Count == 0 ? null : string.Join(", ", Categories.Select(o => o.Name));

    [Ignore]
    public List<Country>? Countries { get; set; }

    [JsonIgnore]
    [Name("Countries")]
    public string? CountriesFlattened => Countries == null || Countries.Count == 0 ? null : string.Join(", ", Countries.Select(o => o.Name));

    [Ignore]
    public List<Language>? Languages { get; set; }

    [JsonIgnore]
    [Name("Languages")]
    public string? LanguagesFlattened => Languages == null || Languages.Count == 0 ? null : string.Join(", ", Languages.Select(o => o.Name));

    [Ignore]
    public List<Skill>? Skills { get; set; }

    [JsonIgnore]
    [Name("Skills")]
    public string? SkillsFlattened => Skills == null || Skills.Count == 0 ? null : string.Join(", ", Skills.Select(o => o.Name));

    [Ignore]
    public List<Lookups.OpportunityVerificationType>? VerificationTypes { get; set; }

    [JsonIgnore]
    [Name("Verification Types")]
    public string? VerificationTypesFlattened => VerificationTypes == null || VerificationTypes.Count == 0 ? null : string.Join(", ", VerificationTypes.Select(o => o.Description));
  }
}
