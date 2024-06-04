using CsvHelper.Configuration.Attributes;
using Newtonsoft.Json;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityInfo
  {
    [Ignore]
    public Guid Id { get; set; }

    [Ignore]
    public Guid UserId { get; set; }

    [Ignore]
    public string UserEmail { get; set; }

    [Name("Student Display Name")]
    public string? UserDisplayName { get; set; }

    [Name("Student Country")]
    public string? UserCountry { get; set; }

    [Ignore]
    public string? UserEducation { get; set; }

    [Ignore]
    public Guid? UserPhotoId { get; set; }

    [Ignore]
    public string? UserPhotoURL { get; set; }

    [Ignore]
    public Guid OpportunityId { get; set; }

    [Name("Opportunity Title")]
    public string OpportunityTitle { get; set; }

    [Ignore]
    public string OpportunityDescription { get; set; }

    [Ignore]
    public string OpportunityType { get; set; }

    [Ignore]
    public string OpportunityCommitmentIntervalDescription { get; set; }

    [Ignore]
    public int OpportunityParticipantCountTotal { get; set; }

    [Name("Opportunity Date Start")]
    public DateTimeOffset OpportunityDateStart { get; set; }

    [Name("Opportunity Date End")]
    public DateTimeOffset? OpportunityDateEnd { get; set; }

    [Ignore]
    public Guid OrganizationId { get; set; }

    [Ignore]
    public string OrganizationName { get; set; }

    [Ignore]
    public string? OrganizationLogoURL { get; set; }

    [Ignore]
    public Guid ActionId { get; set; }

    [Ignore]
    public Action Action { get; set; }

    [Ignore]
    public Guid? VerificationStatusId { get; set; }

    [Name("Status")]
    public VerificationStatus? VerificationStatus { get; set; }

    [Name("Comment")]
    public string? CommentVerification { get; set; }

    [Name("Date Start")]
    public DateTimeOffset? DateStart { get; set; }

    [Name("Date End")]
    public DateTimeOffset? DateEnd { get; set; }

    [Name("Date Completed")]
    public DateTimeOffset? DateCompleted { get; set; }

    [Name("Zlto Reward")]
    public decimal? ZltoReward { get; set; }

    [Ignore] //reserved for future use
    public decimal? YomaReward { get; set; }

    [Name("Date Connected")]
    public DateTimeOffset DateModified { get; set; }

    [Ignore]
    public List<MyOpportunityInfoVerification>? Verifications { get; set; }

    [Ignore]
    public List<Skill>? Skills { get; set; }

    [JsonIgnore]
    [Name("Skills")]
    public string? SkillsFlattened => Skills == null || Skills.Count == 0 ? null : string.Join(", ", Skills.Select(o => o.Name));
  }
}
