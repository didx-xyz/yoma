using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Infrastructure.Database.Core.Entities
{
    public abstract class BaseEntity<TKey>
    {
        [Required]
        [Key]
        public virtual TKey Id { get; set; }
    }
}
