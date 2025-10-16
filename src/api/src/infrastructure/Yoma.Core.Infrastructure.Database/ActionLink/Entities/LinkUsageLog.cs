using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.ActionLink.Entities
{
  [Table("UsageLog", Schema = "ActionLink")]
  [Index(nameof(LinkId), nameof(UserId), IsUnique = true)]
  [Index(nameof(UsernameClaimed), nameof(DateCreated))]
  public class LinkUsageLog : Shared.Entities.BaseEntity<Guid>
  {
    [ForeignKey("LinkId")]
    public Guid LinkId { get; set; }
    public Link Link { get; set; } = null!;

    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public Entity.Entities.User User { get; set; } = null!;

    [Column(TypeName = "varchar(320)")]
    public string? UsernameClaimed { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
