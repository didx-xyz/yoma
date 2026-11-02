using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.DidxMe.Entities
{
  /// <summary>
  /// Persists the domain-to-preset compatibility mapping described by Models.CredentialPresetMapping.
  /// The actual preset and its associated template are owned by didx:me.
  /// </summary>
  [Table("CredentialPresetMapping", Schema = "DidxMe")]
  [Index(nameof(TenantAlias), nameof(Name), nameof(Version), IsUnique = true)]
  [Index(nameof(TenantAlias), nameof(Vct), IsUnique = true)]
  public class CredentialPresetMapping : BaseEntity<string>
  {
    [Column(TypeName = "varchar(125)")]
    public override required string Id { get; set; }

    [Required]
    [Column(TypeName = "varchar(125)")]
    public string TenantAlias { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(125)")]
    public string Name { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(20)")]
    public string Version { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(20)")]
    public string ArtifactType { get; set; } = null!;

    [Required]
    [Column(TypeName = "text")]
    public string AttributeNames { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(250)")]
    public string PresetId { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(500)")]
    public string Vct { get; set; } = null!;

    public DateTimeOffset DateCreated { get; set; }
  }
}
