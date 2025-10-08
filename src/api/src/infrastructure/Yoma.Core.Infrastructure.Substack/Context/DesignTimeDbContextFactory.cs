using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Yoma.Core.Infrastructure.Substack.Context
{
  public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<SubstackDbContext>
  {
    public SubstackDbContext CreateDbContext(string[] args)
    {
      IConfigurationRoot configuration = new ConfigurationBuilder()
          .SetBasePath(Directory.GetCurrentDirectory())
          .AddJsonFile("appsettings.design.json")
          .Build();
      var builder = new DbContextOptionsBuilder<SubstackDbContext>();
      var connectionString = configuration.GetConnectionString("SQLConnection");
      builder.UseNpgsql(connectionString);
      return new SubstackDbContext(builder.Options);
    }
  }
}
