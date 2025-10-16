using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.AriesCloud.Entities
{
  [Table("Credential", Schema = "AriesCloud")]
  [Index(nameof(ClientReferent), IsUnique = true)]
  [Index(nameof(SourceTenantId), nameof(TargetTenantId), nameof(ArtifactType))]
  public class Credential : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string ClientReferent { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string SourceTenantId { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string TargetTenantId { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(125)")]
    public string SchemaId { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(20)")]
    public string ArtifactType { get; set; } = null!;

    [Required]
    [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
    public string Attributes { get; set; } = null!;

    [Required]
    [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
    public string SignedValue { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
