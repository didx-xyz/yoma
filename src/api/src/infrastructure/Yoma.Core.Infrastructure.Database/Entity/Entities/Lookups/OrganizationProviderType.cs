using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities.Lookups
{
    [Table("OrganizationProviderType", Schema = "Entity")]
    [Index(nameof(Name), IsUnique = true)]
    public class OrganizationProviderType : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "varchar(255)")]
        public string Name { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
