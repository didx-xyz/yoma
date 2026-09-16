using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.Shared.Converters;
using Yoma.Core.Infrastructure.Shared.Interceptors;
using Yoma.Core.Infrastructure.Substack.Entities;

namespace Yoma.Core.Infrastructure.Substack.Context
{
  public class SubstackDbContext : DbContext
  {
    #region Constructors
    public SubstackDbContext(DbContextOptions<SubstackDbContext> options) : base(options) { }
    #endregion

    #region Public Members
    public DbSet<FeedSyncTracking> FeedSyncTracking { get; set; }

    public DbSet<NewsArticle> NewsArticle { get; set; }
    #endregion

    #region Protected Members
    protected override void OnModelCreating(ModelBuilder builder)
    {
      builder.HasPostgresExtension("pg_trgm");

      builder.Entity<NewsArticle>()
          .HasIndex(o => o.Title, "IX_NewsArticle_Title_Trgm")
          .HasMethod("gin")
          .HasOperators("gin_trgm_ops")
          .IsCreatedConcurrently();

      foreach (var entityType in builder.Model.GetEntityTypes())
      {
        foreach (var property in entityType.GetProperties())
        {
          if (property.ClrType == typeof(DateTimeOffset))
          {
            var entityTypeBuilder = builder.Entity(entityType.ClrType);
            var propertyBuilder = entityTypeBuilder.Property(property.ClrType, property.Name);
            propertyBuilder.HasConversion(new UtcDateTimeOffsetConverter());
          }
        }
      }

      builder.Entity<NewsArticle>()
      .HasIndex(o => new { o.Description })
      .HasMethod("GIN")
      .IsTsVectorExpressionIndex("english");
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
      optionsBuilder.AddInterceptors(new UtcSaveChangesInterceptor(), new EmptyStringToNullInterceptor());
    }
    #endregion
  }
}
