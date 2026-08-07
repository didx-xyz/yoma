using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Entities;
using Yoma.Core.Infrastructure.Shared.Converters;
using Yoma.Core.Infrastructure.Shared.Interceptors;

namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Context
{
  public sealed class IXOPartnerSyncDbContext : DbContext
  {
    #region Constructor
    public IXOPartnerSyncDbContext(DbContextOptions<IXOPartnerSyncDbContext> options) : base(options) { }
    #endregion

    #region Public Members
    public DbSet<Opportunity> Opportunity { get; set; }
    #endregion

    #region Protected Members
    protected override void OnModelCreating(ModelBuilder builder)
    {
      foreach (var entityType in builder.Model.GetEntityTypes())
      {
        foreach (var property in entityType.GetProperties())
        {
          if (property.ClrType == typeof(DateTimeOffset))
          {
            var entityTypeBuilder = builder.Entity(entityType.ClrType);
            entityTypeBuilder.Property(property.ClrType, property.Name)
              .HasConversion(new UtcDateTimeOffsetConverter());
          }
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
