using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.DidxMe.Entities
{
  /// <summary>
  /// Persists cross-system identifiers and progress described by Models.IssuanceMapping.
  /// This is adapter bookkeeping, not a duplicate holder wallet or proof of remote absence.
  /// </summary>
  [Table("IssuanceMapping", Schema = "DidxMe")]
  [Index(nameof(TenantAlias), nameof(TenantIdHolder), nameof(ClientReferentValue))]
  public class IssuanceMapping : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(125)")]
    public string TenantAlias { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(125)")]
    public string PresetMappingId { get; set; } = null!;

    [ForeignKey(nameof(PresetMappingId))]
    public CredentialPresetMapping PresetMapping { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(125)")]
    public string TenantIdIssuer { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(125)")]
    public string TenantIdHolder { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(125)")]
    public string ClientReferentKey { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(125)")]
    public string ClientReferentValue { get; set; } = null!;

    [Column(TypeName = "varchar(125)")]
    public string? IssuanceId { get; set; }

    [Column(TypeName = "varchar(125)")]
    public string? IssuerCredentialId { get; set; }

    [Column(TypeName = "varchar(125)")]
    public string? WalletCredentialId { get; set; }

    public bool DeliveryCompleted { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
