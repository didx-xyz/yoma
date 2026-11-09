using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.DidxMe.Entities;
using Yoma.Core.Infrastructure.Shared.Converters;
using Yoma.Core.Infrastructure.Shared.Interceptors;

namespace Yoma.Core.Infrastructure.DidxMe.Context
{
  public class ProviderDbContext : DbContext
  {
    #region Constructors
    public ProviderDbContext(DbContextOptions<ProviderDbContext> options) : base(options) { }
    #endregion

    #region Public Members
    public DbSet<CredentialPresetMapping> CredentialPresetMapping { get; set; }

    public DbSet<IssuanceMapping> IssuanceMapping { get; set; }
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
            builder.Entity(entityType.ClrType)
              .Property(property.ClrType, property.Name)
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
