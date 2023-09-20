using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.AriesCloud.Entities
{
    [Table("InvitationCache", Schema = "ariescloud")]
    [Index(nameof(SourceTenantId), nameof(TargetTenantId), nameof(InvitationId), nameof(Type), nameof(Status), nameof(ThreadId))]
    public class InvitationCache : BaseEntity<Guid>
    {
        [Required]
        public Guid SourceTenantId { get; set; }
        [ForeignKey("SourceTenantId")]

        [Required]
        public Guid TargetTenantId { get; set; }

        [Required]
        public Guid InvitationId { get; set; }

        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string InvitationPayload { get; set; }

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string Type { get; set; }

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string Status { get; set; }

        public Guid? ThreadId { get; set; }

        [Required]
        public DateTimeOffset DateStamp { get; set; }
    }
}
