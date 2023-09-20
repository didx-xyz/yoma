using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Yoma.Core.Infrastructure.AriesCloud.Context
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AriesCloudDbContext>
    {
        public AriesCloudDbContext CreateDbContext(string[] args)
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.design.json")
                .Build();
            var builder = new DbContextOptionsBuilder<AriesCloudDbContext>();
            var connectionString = configuration.GetConnectionString("SQLConnection");
            builder.UseSqlServer(connectionString);
            return new AriesCloudDbContext(builder.Options);
        }
    }
}
