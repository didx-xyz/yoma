using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;
using Yoma.Core.Infrastructure.Database.Opportunity.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
  [Table("Opportunity", Schema = "Opportunity")]
  [Index(nameof(Title), IsUnique = true)]
  [Index(nameof(TypeId), nameof(OrganizationId), nameof(ZltoReward), nameof(DifficultyId), nameof(CommitmentIntervalId), nameof(CommitmentIntervalCount), nameof(StatusId), nameof(Keywords),
        nameof(DateStart), nameof(DateEnd), nameof(CredentialIssuanceEnabled), nameof(DateCreated), nameof(CreatedByUserId), nameof(DateModified), nameof(ModifiedByUserId))]
  public class Opportunity : BaseEntity<Guid>
  {
    //support specials characters like emojis  
    [Required]
    [Column(TypeName = "varchar(255)")] //MS SQL: nvarchar(255)
    public string Title { get; set; }

    //support specials characters like emojis  
    [Required]
    [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
    public string Description { get; set; }

    [Required]
    [ForeignKey("TypeId")]
    public Guid TypeId { get; set; }
    public OpportunityType Type { get; set; }

    [Required]
    [ForeignKey("OrganizationId")]
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; }

    //support specials characters like emojis  
    [Column(TypeName = "varchar(500)")] //MS SQL: nvarchar(500)
    public string? Summary { get; set; }

    //support specials characters like emojis  
    [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
    public string? Instructions { get; set; }

    [Column(TypeName = "varchar(2048)")]
    public string? URL { get; set; }

    [Column(TypeName = "varchar(2048)")]
    public string? ShortURL { get; set; }   

    [Column(TypeName = "decimal(8,2)")]
    public decimal? ZltoReward { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? ZltoRewardPool { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? ZltoRewardCumulative { get; set; }

    [Column(TypeName = "decimal(8,2)")]
    public decimal? YomaReward { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? YomaRewardPool { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? YomaRewardCumulative { get; set; }

    [Required]
    public bool VerificationEnabled { get; set; }

    [Column(TypeName = "varchar(20)")]
    public string? VerificationMethod { get; set; }

    [Required]
    [ForeignKey("DifficultyId")]
    public Guid DifficultyId { get; set; }
    public OpportunityDifficulty Difficulty { get; set; }

    [Required]
    [ForeignKey("CommitmentIntervalId")]
    public Guid CommitmentIntervalId { get; set; }
    public TimeInterval CommitmentInterval { get; set; }

    [Required]
    public short CommitmentIntervalCount { get; set; }

    public int? ParticipantLimit { get; set; }

    public int? ParticipantCount { get; set; }

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public OpportunityStatus Status { get; set; }

    [Column(TypeName = "varchar(500)")]
    public string? Keywords { get; set; }

    [Required]
    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    [Required]
    public bool CredentialIssuanceEnabled { get; set; }

    [Column(TypeName = "varchar(255)")]
    public string? SSISchemaName { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    [ForeignKey("CreatedByUserId")]
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }

    [Required]
    [ForeignKey("ModifiedByUserId")]
    public Guid ModifiedByUserId { get; set; }
    public User ModifiedByUser { get; set; }

    public ICollection<OpportunityCategory> Categories { get; set; }

    public ICollection<OpportunityCountry> Countries { get; set; }

    public ICollection<OpportunityLanguage> Languages { get; set; }

    public ICollection<OpportunitySkill>? Skills { get; set; }

    public ICollection<OpportunityVerificationType>? VerificationTypes { get; set; }
  }
}
