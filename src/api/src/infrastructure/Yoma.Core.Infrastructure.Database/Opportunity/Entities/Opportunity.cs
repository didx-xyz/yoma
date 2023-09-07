using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;
using Yoma.Core.Infrastructure.Database.Opportunity.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
    [Table("Opportunity", Schema = "opportunity")]
    [Index(nameof(Title), IsUnique = true)]
    [Index(nameof(TypeId), nameof(OrganizationId), nameof(DifficultyId), nameof(CommitmentIntervalId), nameof(StatusId), nameof(Keywords),
        nameof(DateStart), nameof(DateEnd), nameof(DateCreated), nameof(DateModified))]
    public class Opportunity : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "varchar(255)")]
        public string Title { get; set; }

        [Required]
        [Column(TypeName = "varchar(MAX)")]
        public string Description { get; set; }

        [Required]
        [ForeignKey("TypeId")]
        public Guid TypeId { get; set; }
        public OpportunityType Type { get; set; }

        [Required]
        [ForeignKey("OrganizationId")]
        public Guid OrganizationId { get; set; }
        public Organization Organization { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? Summary { get; set; }

        [Column(TypeName = "varchar(MAX)")]
        public string? Instructions { get; set; }

        [Column(TypeName = "varchar(2048)")]
        public string? URL { get; set; }

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
        public bool VerificationSupported { get; set; }

        [Required]
        public bool SSIIntegrated { get; set; }

        [Required]
        [ForeignKey("DifficultyId")]
        public Guid DifficultyId { get; set; }
        public OpportunityDifficulty Difficulty { get; set; }

        [Required]
        [ForeignKey("CommitmentIntervalId")]
        public Guid CommitmentIntervalId { get; set; }
        public TimeInterval CommitmentInterval { get; set; }

        public short? CommitmentIntervalCount { get; set; }

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
        public DateTimeOffset DateCreated { get; set; }

        [Required]
        [Column(TypeName = "varchar(320)")]
        public string CreatedBy { get; set; }

        [Required]
        public DateTimeOffset DateModified { get; set; }

        [Required]
        [Column(TypeName = "varchar(320)")]
        public string ModifiedBy { get; set; }

        public ICollection<OpportunityCategory> Categories { get; set; }

        public ICollection<OpportunityCountry> Countries { get; set; }

        public ICollection<OpportunityLanguage> Languages { get; set; }

        public ICollection<OpportunitySkill> Skills { get; set; }

        public ICollection<OpportunityVerificationType> VerificationTypes { get; set; }
    }
}
