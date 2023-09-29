using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.AriesCloud.Entities;

namespace Yoma.Core.Infrastructure.AriesCloud.Context
{
    public class AriesCloudDbContext : DbContext
    {
        #region Constructors
        public AriesCloudDbContext(DbContextOptions<AriesCloudDbContext> options) : base(options) { }
        #endregion

        #region Public Members
        public DbSet<CredentialSchema> CredentialSchema { get; set; }

        public DbSet<Connection> Connection { get; set; }
        #endregion
    }
}
