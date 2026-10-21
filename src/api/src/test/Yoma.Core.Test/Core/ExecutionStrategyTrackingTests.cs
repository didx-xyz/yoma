using Microsoft.EntityFrameworkCore;
using Npgsql;
using Xunit;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Services;
using Yoma.Core.Infrastructure.Database.Referral.Entities;

namespace Yoma.Core.Test.Core
{
  public class ExecutionStrategyTrackingTests
  {
    #region Tests
    [Theory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public async Task TrackingCleanupRemainsOptInOnSuccessAndFailure(bool clearTrackedChanges, bool fail)
    {
      await using var context = CreateContext();
      var strategy = new ExecutionStrategyService(context);
      context.Attach(new ProgramPathwayTask { Id = Guid.NewGuid() });

      Task Execute() => clearTrackedChanges
        ? strategy.ExecuteInExecutionStrategyAsync(Body, true)
        : strategy.ExecuteInExecutionStrategyAsync(Body);
      Task Body() => fail ? throw new InvalidOperationException("Probe failed") : Task.CompletedTask;

      if (fail) await Assert.ThrowsAsync<InvalidOperationException>(Execute);
      else await Execute();

      Assert.Equal(clearTrackedChanges ? 0 : 1, context.ChangeTracker.Entries().Count());
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task AmbientTransactionStillExecutesOnceAndHonorsTrackingOptIn(bool clearTrackedChanges)
    {
      await using var context = CreateContext();
      var strategy = new ExecutionStrategyService(context);
      context.Attach(new ProgramPathwayTask { Id = Guid.NewGuid() });
      var attempts = 0;
      using var transaction = TransactionScopeHelper.CreateReadCommitted();

      await Assert.ThrowsAsync<PostgresException>(() => strategy.ExecuteInExecutionStrategyAsync(() =>
      {
        attempts++;
        throw new PostgresException("Outer transaction owns the retry", "ERROR", "ERROR", "40001");
      }, clearTrackedChanges));

      Assert.Equal(1, attempts);
      Assert.Equal(clearTrackedChanges ? 0 : 1, context.ChangeTracker.Entries().Count());
    }
    #endregion

    #region Private Members
    private static ApplicationDbContext CreateContext()
    {
      // No database commands run in these model-only probes.
      return new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql("Host=localhost;Database=yoma_referral_pathway_model;Username=unused;Password=unused",
          options => options.EnableRetryOnFailure(1, TimeSpan.Zero, null)).Options);
    }
    #endregion
  }
}
