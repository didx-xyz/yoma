using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Substack.Entities
{
  [Table("FeedSyncTracking", Schema = "Substack")]
  [Index(nameof(FeedType), IsUnique = true)]
  public class FeedSyncTracking : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string FeedType { get; set; } = null!;

    [Column(TypeName = "varchar(512)")]
    public string? ETag { get; set; }

    public DateTimeOffset? FeedLastModified { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
