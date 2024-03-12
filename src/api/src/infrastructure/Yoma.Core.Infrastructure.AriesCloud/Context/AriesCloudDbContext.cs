using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.AriesCloud.Entities;
using Yoma.Core.Infrastructure.Shared.Converters;
using Yoma.Core.Infrastructure.Shared.Interceptors;

namespace Yoma.Core.Infrastructure.AriesCloud.Context
{
    public class AriesCloudDbContext : DbContext
    {
        #region Constructors
        public AriesCloudDbContext(DbContextOptions<AriesCloudDbContext> options) : base(options) { }
        #endregion

        #region Public Members
        public DbSet<Credential> Credential { get; set; }   

        public DbSet<CredentialSchema> CredentialSchema { get; set; }

        public DbSet<Connection> Connection { get; set; }
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
                        var propertyBuilder = entityTypeBuilder.Property(property.ClrType, property.Name);
                        propertyBuilder.HasConversion(new UtcDateTimeOffsetConverter());
                    }
                }
            }
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.AddInterceptors(new UtcSaveChangesInterceptor());
        }
        #endregion
    }
}
