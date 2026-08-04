using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.JobJack.Entities
{
  [Table("FeedSyncTracking", Schema = "JobJack")]
  public sealed class FeedSyncTracking : BaseEntity<Guid>
  {
    [Column(TypeName = "varchar(512)")]
    public string? ETag { get; set; }

    public DateTimeOffset? FeedLastModified { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
