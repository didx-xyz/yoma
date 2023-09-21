using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Infrastructure.AriesCloud.Entities
{
    public abstract class BaseEntity<TKey>
    {
        [Required]
        [Key]
        public TKey Id { get; set; }
    }
}
