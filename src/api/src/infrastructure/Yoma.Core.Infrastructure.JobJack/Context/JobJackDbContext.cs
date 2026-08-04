using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.JobJack.Entities;
using Yoma.Core.Infrastructure.Shared.Converters;
using Yoma.Core.Infrastructure.Shared.Interceptors;

namespace Yoma.Core.Infrastructure.JobJack.Context
{
  public sealed class JobJackDbContext : DbContext
  {
    #region Constructors
    public JobJackDbContext(DbContextOptions<JobJackDbContext> options) : base(options) { }
    #endregion

    #region Public Members
    public DbSet<FeedSyncTracking> FeedSyncTracking { get; set; }

    public DbSet<Opportunity> Opportunity { get; set; }
    #endregion

    #region Protected Members
    protected override void OnModelCreating(ModelBuilder builder)
    {
      foreach (var entityType in builder.Model.GetEntityTypes())
      {
        foreach (var property in entityType.GetProperties())
        {
          if (property.ClrType != typeof(DateTimeOffset)) continue;
          builder.Entity(entityType.ClrType).Property(property.ClrType, property.Name)
            .HasConversion(new UtcDateTimeOffsetConverter());
        }
      }
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
      optionsBuilder.AddInterceptors(new UtcSaveChangesInterceptor(), new EmptyStringToNullInterceptor());
    }
    #endregion
  }
}
