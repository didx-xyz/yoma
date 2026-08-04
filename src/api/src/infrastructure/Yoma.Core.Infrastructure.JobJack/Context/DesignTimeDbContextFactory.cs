using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Yoma.Core.Infrastructure.JobJack.Context
{
  public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<JobJackDbContext>
  {
    public JobJackDbContext CreateDbContext(string[] args)
    {
      var configuration = new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.design.json")
        .Build();

      var builder = new DbContextOptionsBuilder<JobJackDbContext>();
      builder.UseNpgsql(configuration.GetConnectionString("SQLConnection"));
      return new JobJackDbContext(builder.Options);
    }
  }
}
