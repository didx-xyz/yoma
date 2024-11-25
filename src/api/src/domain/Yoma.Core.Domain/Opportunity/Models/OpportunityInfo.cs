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

    [Name("Zlto Reward Cumulative")]
    public decimal? ZltoRewardCumulative { get; set; }

    [Ignore] //reserved for future use
    public decimal? YomaReward { get; set; }

    [Ignore] //reserved for future use
    public decimal? YomaRewardCumulative { get; set; }

    [Name("Verification Enabled")]
    [BooleanFalseValues("No")]
    [BooleanTrueValues("Yes")]
    public bool VerificationEnabled { get; set; }

    [Name("Verification Method")]
    public VerificationMethod? VerificationMethod { get; set; }

    public string Difficulty { get; set; }

    [Ignore]
    public Core.TimeIntervalOption CommitmentInterval { get; set; }

    [Ignore]
    public short CommitmentIntervalCount { get; set; }

    [Name("Commitment Interval")]
    public string CommitmentIntervalDescription { get; set; }

    #region Engagement
    #region Verification Limits and Counts
    [Name("Participant Limit")]
    public int? ParticipantLimit { get; set; }

    [Name("Participant Count Completed")]
    public int ParticipantCountCompleted { get; set; }

    [Name("Participant Count Pending")]
    public int ParticipantCountPending { get; set; }

    [Name("Participant Count Total")]
    public int ParticipantCountTotal { get; set; }

    [Name("Participant Limit Reached")]
    [BooleanFalseValues("No")]
    [BooleanTrueValues("Yes")]
    public bool ParticipantLimitReached { get; set; }
    #endregion Verification Limits and Counts

    [Name("Count Viewed")]
    public int CountViewed { get; set; }

    [Name("Count Got-To Clicks")]
    public int CountNavigatedExternalLink { get; set; }
    #endregion Engagement

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
    public bool Featured { get; set; }

    [Name("Engagement Type")]
    public Core.EngagementTypeOption? EngagementType { get; set; }

    [BooleanFalseValues("No")]
    [BooleanTrueValues("Yes")]
    public bool ShareWithPartners { get; set; }

    [BooleanFalseValues("No")]
    [BooleanTrueValues("Yes")]
    public bool Hidden { get; set; }

    [JsonIgnore]
    [Name("Partner External ID")]
    public string? ExternalId { get; set; }

    [BooleanFalseValues("No")]
    [BooleanTrueValues("Yes")]
    public bool Published { get; set; }

    [Ignore]
    public string YomaInfoURL { get; set; }

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
