using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.SSI.Entities.Lookups
{
  [Table("CredentialIssuanceStatus", Schema = "SSI")]
  [Index(nameof(Name), IsUnique = true)]
  public class SSICredentialIssuanceStatus : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(20)")]
    public string Name { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
