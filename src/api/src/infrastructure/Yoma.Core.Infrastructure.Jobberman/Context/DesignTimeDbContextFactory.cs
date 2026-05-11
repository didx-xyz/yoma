using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Yoma.Core.Infrastructure.Jobberman.Context
{
  public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<JobbermanDbContext>
  {
    public JobbermanDbContext CreateDbContext(string[] args)
    {
      IConfigurationRoot configuration = new ConfigurationBuilder()
          .SetBasePath(Directory.GetCurrentDirectory())
          .AddJsonFile("appsettings.design.json")
          .Build();
      var builder = new DbContextOptionsBuilder<JobbermanDbContext>();
      var connectionString = configuration.GetConnectionString("SQLConnection");
      builder.UseNpgsql(connectionString);
      return new JobbermanDbContext(builder.Options);
    }
  }
}
