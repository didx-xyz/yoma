using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Yoma.Core.Infrastructure.Database.Context
{
  public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
  {
    public ApplicationDbContext CreateDbContext(string[] args)
    {
      IConfigurationRoot configuration = new ConfigurationBuilder()
          .SetBasePath(Directory.GetCurrentDirectory())
          .AddJsonFile("appsettings.design.json")
          .Build();
      var builder = new DbContextOptionsBuilder<ApplicationDbContext>();
      var connectionString = configuration.GetConnectionString("SQLConnection");
      builder.UseNpgsql(connectionString);
      return new ApplicationDbContext(builder.Options);
    }
  }
}
