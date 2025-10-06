using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Substack.Entities
{
  [Table("NewsArticle", Schema = "Substack")]
  [Index(nameof(Title), nameof(PublishedDate), nameof(DateCreated), nameof(DateModified))]
  [Index(nameof(FeedType), nameof(ExternalId), IsUnique = true)]
  public class NewsArticle : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string FeedType { get; set; }

    /// <summary>
    /// Unique identifier for the article — corresponds to the Substack RSS <guid> element.
    /// Typically a full canonical URL, not a UUID.
    /// </summary>
    [Required]
    [Column(TypeName = "varchar(2048)")]
    public string ExternalId { get; set; }

    [Required]
    [Column(TypeName = "varchar(512)")]
    public string Title { get; set; }

    [Required]
    [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
    public string Description { get; set; }

    [Required]
    [Column(TypeName = "varchar(2048)")]
    public string URL { get; set; }

    [Column(TypeName = "varchar(2048)")]
    public string? ThumbnailURL { get; set; }

    [Required]
    public DateTimeOffset PublishedDate { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
