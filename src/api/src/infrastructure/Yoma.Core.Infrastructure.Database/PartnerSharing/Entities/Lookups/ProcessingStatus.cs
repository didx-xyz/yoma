using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.PartnerSharing.Entities.Lookups
{
  [Table("ProcessingStatus", Schema = "PartnerSharing")]
  [Index(nameof(Name), IsUnique = true)]
  public class ProcessingStatus : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(20)")]
    public string Name { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
