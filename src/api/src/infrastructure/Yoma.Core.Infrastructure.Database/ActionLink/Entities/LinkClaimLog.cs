using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.ActionLink.Entities
{
  [Table("ClaimLog", Schema = "ActionLink")]
  [Index(nameof(LinkId), nameof(UserId), IsUnique = true)]
  [Index(nameof(DateCreated))]
  public class LinkClaimLog : BaseEntity<Guid>
  {
    [ForeignKey("LinkId")]
    public Guid LinkId { get; set; }
    public Link Link { get; set; }

    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public Entity.Entities.User? User { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
