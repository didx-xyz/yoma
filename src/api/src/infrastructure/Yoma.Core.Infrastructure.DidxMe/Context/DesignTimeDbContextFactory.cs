using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Yoma.Core.Infrastructure.DidxMe.Context
{
  public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ProviderDbContext>
  {
    #region Public Members
    public ProviderDbContext CreateDbContext(string[] args)
    {
      var configuration = new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.design.json")
        .Build();

      var builder = new DbContextOptionsBuilder<ProviderDbContext>();
      builder.UseNpgsql(configuration.GetConnectionString("SQLConnection"));
      return new ProviderDbContext(builder.Options);
    }
    #endregion
  }
}
