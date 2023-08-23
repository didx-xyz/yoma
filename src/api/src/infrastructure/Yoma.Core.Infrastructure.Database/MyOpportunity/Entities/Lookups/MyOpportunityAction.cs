using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.MyOpportunity.Entities.Lookups
{
    [Table("MyOpportunityAction", Schema = "opportunity")]
    [Index(nameof(Name), IsUnique = true)]
    public class MyOpportunityAction : BaseEntity<Guid>
    {
        [Column(TypeName = "varchar(125)")]
        public string Name { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
