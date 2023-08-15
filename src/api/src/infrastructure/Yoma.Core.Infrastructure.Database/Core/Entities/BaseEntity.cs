using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Infrastructure.Database.Core.Entities
{
  public abstract class BaseEntity<TKey>
  {
    [Required]
    [Key]
    public TKey Id { get; set; }
  }
}
