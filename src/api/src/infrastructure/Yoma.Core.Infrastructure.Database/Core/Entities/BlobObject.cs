using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Core.Entities
{
  [Table("Blob", Schema = "Object")]
  [Index(nameof(Key), IsUnique = true)]
  [Index(nameof(StorageType), nameof(FileType), nameof(ParentId))]
  public class BlobObject : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(25)")]
    public string StorageType { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string FileType { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(125)")]
    public string Key { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(127)")]
    public string ContentType { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(255)")]
    public string OriginalFileName { get; set; } = null!;

    [ForeignKey("ParentId")]
    public Guid? ParentId { get; set; }
    public BlobObject? Parent { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
