using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Context
{
  public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<IXOPartnerSyncDbContext>
  {
    public IXOPartnerSyncDbContext CreateDbContext(string[] args)
    {
      var configuration = new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.design.json")
        .Build();

      var builder = new DbContextOptionsBuilder<IXOPartnerSyncDbContext>();
      builder.UseNpgsql(configuration.GetConnectionString("SQLConnection"));
      return new IXOPartnerSyncDbContext(builder.Options);
    }
  }
}
