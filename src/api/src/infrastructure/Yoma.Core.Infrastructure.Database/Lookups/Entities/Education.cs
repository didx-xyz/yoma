using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Lookups.Entities
{
    [Table("Education", Schema = "Lookup")]
    [Index(nameof(Name), IsUnique = true)]
    public class Education : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "varchar(20)")]
        public string Name { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
