using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.AriesCloud.Entities
{
  [Table("Credential", Schema = "AriesCloud")]
  [Index(nameof(ClientReferent), IsUnique = true)]
  [Index(nameof(SourceTenantId), nameof(TargetTenantId), nameof(ArtifactType))]
  public class Credential : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string ClientReferent { get; set; }

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string SourceTenantId { get; set; }

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string TargetTenantId { get; set; }

    [Required]
    [Column(TypeName = "varchar(125)")]
    public string SchemaId { get; set; }

    [Required]
    [Column(TypeName = "varchar(20)")]
    public string ArtifactType { get; set; }

    [Required]
    [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
    public string Attributes { get; set; }

    [Required]
    [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
    public string SignedValue { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
