using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Yoma.Core.Infrastructure.Umuzi.Context
{
  public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<UmuziDbContext>
  {
    public UmuziDbContext CreateDbContext(string[] args)
    {
      var configuration = new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.design.json")
        .Build();

      var builder = new DbContextOptionsBuilder<UmuziDbContext>();
      builder.UseNpgsql(configuration.GetConnectionString("SQLConnection"));
      return new UmuziDbContext(builder.Options);
    }
  }
}
