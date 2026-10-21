using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Moq;
using Npgsql;
using System.Transactions;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Test.Referral.Builders;
using Yoma.Core.Test.Referral.Fixtures;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Referral.Repositories;
using TaskEntity = Yoma.Core.Infrastructure.Database.Referral.Entities.ProgramPathwayTask;
using Opportunity = Yoma.Core.Domain.Opportunity.Models.Opportunity;

namespace Yoma.Core.Test.Referral.Services
{
  public class ProgramPathwayReassignmentTests
  {
    #region Tests
    [Theory]
    [InlineData("swap")]
    [InlineData("cycle-three")]
    [InlineData("cycle-four")]
    [InlineData("replacement")]
    [InlineData("display-order")]
    [InlineData("remove-add")]
    [InlineData("unchanged")]
    public async Task ReconcilesRetainedAssignmentsBeforeFinalUpdates(string scenario)
    {
      var fixture = new Fixture(scenario);
      var stored = fixture.Program.Pathway!.Steps![0].Tasks!.Select(Clone).ToList();
      var snapshots = new List<ProgramPathwayTask>();
      fixture.Mock.ProgramPathwayTaskRepository.Setup(repository => repository.Query())
        .Returns(() => stored.Select(Clone).AsQueryable());
      fixture.Mock.ProgramPathwayTaskRepository.Setup(repository => repository.Update(It.IsAny<ProgramPathwayTask>()))
        .ReturnsAsync((ProgramPathwayTask item) =>
        {
          Assert.NotNull(Transaction.Current);
          Assert.DoesNotContain(stored, existing => existing.Id != item.Id && existing.StepId == item.StepId &&
            existing.EntityType == item.EntityType && item.Opportunity != null && existing.Opportunity?.Id == item.Opportunity.Id);
          var existing = stored.Single(existing => existing.Id == item.Id);
          item.DateCreated = existing.DateCreated;
          snapshots.Add(Clone(item));
          stored[stored.IndexOf(existing)] = Clone(item);
          return item;
        });
      fixture.Mock.ProgramPathwayTaskRepository.Setup(repository => repository.Delete(It.IsAny<ProgramPathwayTask>()))
        .Returns((ProgramPathwayTask item) => { stored.RemoveAll(existing => existing.Id == item.Id); return Task.CompletedTask; });
      fixture.Mock.ProgramPathwayTaskRepository.Setup(repository => repository.Create(It.IsAny<ProgramPathwayTask>()))
        .ReturnsAsync((ProgramPathwayTask item) =>
        {
          item.Id = Guid.NewGuid();
          stored.Add(Clone(item));
          return item;
        });

      var result = await fixture.Mock.Build().Update(fixture.Request);

      fixture.Mock.ExecutionStrategyService.Verify(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), true), Times.Once);
      AssertAssignments(fixture, stored);
      Assert.Equal(stored.Select(item => item.Id).Order(), result.Pathway!.Steps![0].Tasks!.Select(item => item.Id).Order());
      var firstFinal = snapshots.FindIndex(item => item.Opportunity != null);
      Assert.DoesNotContain(snapshots.Skip(firstFinal), item => item.Opportunity == null);
      if (scenario is "display-order" or "unchanged") Assert.DoesNotContain(snapshots, item => item.Opportunity == null);
      foreach (var id in fixture.RetainedIds)
        fixture.Mock.ProgramPathwayTaskRepository.Verify(repository => repository.Delete(It.Is<ProgramPathwayTask>(item => item.Id == id)), Times.Never);
    }

    [Fact]
    public async Task DuplicateFinalAssignmentsAreRejectedBeforeAnyWrite()
    {
      var fixture = new Fixture("swap");
      fixture.Request.Pathway!.Steps[0].Tasks[1].EntityId = fixture.Request.Pathway.Steps[0].Tasks[0].EntityId;

      var error = await Assert.ThrowsAsync<ValidationException>(() => fixture.Mock.Build().Update(fixture.Request));

      Assert.Contains(error.Errors, failure => failure.ErrorMessage == "Each task in a step must reference a unique entity.");
      fixture.Mock.ProgramPathwayTaskRepository.Verify(repository => repository.Update(It.IsAny<ProgramPathwayTask>()), Times.Never);
      fixture.Mock.ProgramPathwayTaskRepository.Verify(repository => repository.Delete(It.IsAny<ProgramPathwayTask>()), Times.Never);
      fixture.Mock.ProgramRepository.Verify(repository => repository.Update(It.IsAny<Program>()), Times.Never);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task PostgreSqlASwapFailsWithEitherIndividualUpdateOrder(bool reverse)
    {
      await using var context = CreateContext();
      var fixture = new Fixture("swap");
      await CreateFixtureTables(context);
      await Seed(context, fixture);
      var repository = new ProgramPathwayTaskRepository(context);
      var strategy = new Infrastructure.Database.Core.Services.ExecutionStrategyService(context);
      var requests = fixture.Request.Pathway!.Steps[0].Tasks;
      if (reverse) requests.Reverse();

      var error = await Assert.ThrowsAsync<DbUpdateException>(() => strategy.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var transaction = TransactionScopeHelper.CreateReadCommitted();
        foreach (var request in requests)
        {
          var task = Clone(fixture.Program.Pathway!.Steps![0].Tasks!.Single(item => item.Id == request.Id));
          task.Opportunity = new OpportunityItem { Id = request.EntityId };
          await repository.Update(task);
        }
        transaction.Complete();
      }, true));

      var postgres = Assert.IsType<PostgresException>(error.InnerException);
      Assert.Equal(PostgresErrorCodes.UniqueViolation, postgres.SqlState);
      Assert.Equal("IX_ProgramPathwayTask_StepId_EntityType_OpportunityId", postgres.ConstraintName);
    }

    [Theory]
    [InlineData("swap")]
    [InlineData("cycle-three")]
    [InlineData("cycle-four")]
    [InlineData("replacement")]
    [InlineData("display-order")]
    [InlineData("remove-add")]
    [InlineData("unchanged")]
    [InlineData("rollback-clearing")]
    [InlineData("rollback-final")]
    [InlineData("rollback-validation")]
    [InlineData("retry")]
    [InlineData("duplicate")]
    public async Task PostgreSqlPreservesIdentitiesConstraintsReferencesAndRollback(string scenario)
    {
      await using var context = CreateContext();
      var fixture = new Fixture(scenario is "rollback-clearing" or "rollback-final" or "rollback-validation" or "retry" or "duplicate" ? "swap" : scenario);
      var original = fixture.Program.Pathway!.Steps![0].Tasks!.Select(Clone).ToList();
      await CreateFixtureTables(context);
      await Seed(context, fixture);
      var strategy = new Infrastructure.Database.Core.Services.ExecutionStrategyService(context);
      fixture.Mock.ExecutionStrategyService
        .Setup(value => value.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), It.IsAny<bool>()))
        .Returns((Func<Task> action, bool clearTrackedChanges) => strategy.ExecuteInExecutionStrategyAsync(action, clearTrackedChanges));
      var repository = new ProgramPathwayTaskRepository(context);
      fixture.Mock.ProgramPathwayTaskRepository.Setup(value => value.Query()).Returns(() => repository.Query());
      fixture.Mock.ProgramPathwayTaskRepository.Setup(value => value.Delete(It.IsAny<ProgramPathwayTask>()))
        .Returns((ProgramPathwayTask item) => repository.Delete(item));
      fixture.Mock.ProgramPathwayTaskRepository.Setup(value => value.Create(It.IsAny<ProgramPathwayTask>()))
        .Returns((ProgramPathwayTask item) => repository.Create(item));
      var clearing = 0;
      var finals = 0;
      fixture.Mock.ProgramPathwayTaskRepository.Setup(value => value.Update(It.IsAny<ProgramPathwayTask>()))
        .Returns(async (ProgramPathwayTask item) =>
        {
          var result = await repository.Update(item);
          if (item.Opportunity == null)
          {
            clearing++;
            if (scenario == "swap" && clearing == 1)
            {
              // An independent reader must see the original assignments, never the intermediate nulls.
              var readerSettings = new NpgsqlConnectionStringBuilder(System.Environment.GetEnvironmentVariable("YOMA_REFERRAL_PATHWAY_TEST_CONNECTION")) { Enlist = false };
              await using var reader = new NpgsqlConnection(readerSettings.ConnectionString);
              await reader.OpenAsync(TestContext.Current.CancellationToken);
              await using var command = new NpgsqlCommand("""
                SELECT "OpportunityId" FROM "Referral"."ProgramPathwayTask"
                WHERE "StepId" = @stepId ORDER BY "OrderDisplay";
                """, reader);
              command.Parameters.AddWithValue("stepId", fixture.StepId);
              await using var rows = await command.ExecuteReaderAsync(TestContext.Current.CancellationToken);
              foreach (var task in original)
              {
                Assert.True(await rows.ReadAsync(TestContext.Current.CancellationToken));
                Assert.Equal(task.Opportunity!.Id, rows.GetGuid(0));
              }
              Assert.False(await rows.ReadAsync(TestContext.Current.CancellationToken));
            }
            if (scenario == "rollback-clearing" && clearing == 2) throw new ProbeException();
          }
          else
          {
            finals++;
            if (scenario == "rollback-final" && finals == 1) throw new ProbeException();
          }
          return result;
        });

      if (scenario == "duplicate")
      {
        fixture.Request.Pathway!.Steps[0].Tasks[1].EntityId = fixture.Request.Pathway.Steps[0].Tasks[0].EntityId;
        await Assert.ThrowsAsync<ValidationException>(() => fixture.Mock.Build().Update(fixture.Request));
      }
      else if (scenario is "rollback-clearing" or "rollback-final")
        await Assert.ThrowsAsync<ProbeException>(() => fixture.Mock.Build().Update(fixture.Request));
      else if (scenario == "rollback-validation")
      {
        fixture.Opportunities.Values.ToList().ForEach(item => item.VerificationEnabled = false);
        await Assert.ThrowsAsync<ValidationException>(() => fixture.Mock.Build().Update(fixture.Request));
        Assert.Equal(2, finals);
      }
      else
      {
        if (scenario == "retry")
        {
          fixture.Request.Pathway!.Steps[0].Tasks.Reverse();
          var attempt = 0;
          fixture.Mock.ProgramRepository.Setup(value => value.Update(It.IsAny<Program>()))
            .Returns((Program program) => ++attempt == 1
              ? throw new PostgresException("Retry the rolled-back pathway update", "ERROR", "ERROR", "40001")
              : Task.FromResult(program));
        }
        await fixture.Mock.Build().Update(fixture.Request);
      }

      var persisted = await context.ReferralProgramPathwayTask.AsNoTracking()
        .Where(item => item.StepId == fixture.StepId)
        .OrderBy(item => item.OrderDisplay)
        .ToListAsync(TestContext.Current.CancellationToken);
      if (scenario is "duplicate" or "rollback-clearing" or "rollback-final" or "rollback-validation")
      {
        Assert.Equal(original.Select(item => item.Id), persisted.Select(item => item.Id));
        Assert.Equal(original.Select(item => (Guid?)item.Opportunity!.Id), persisted.Select(item => item.OpportunityId));
        Assert.Equal(original.Select(item => item.DateModified), persisted.Select(item => item.DateModified));
      }
      else
      {
        AssertAssignments(fixture, [.. persisted.Select(item => new ProgramPathwayTask
        {
          Id = item.Id,
          StepId = item.StepId,
          Opportunity = new OpportunityItem { Id = item.OpportunityId!.Value },
          Order = item.Order,
          OrderDisplay = item.OrderDisplay,
          DateCreated = item.DateCreated
        })]);
      }
      foreach (var item in persisted.Where(item => fixture.RetainedIds.Contains(item.Id)))
        Assert.Equal(original.Single(originalItem => originalItem.Id == item.Id).DateCreated, item.DateCreated);
      var retainedReferences = await context.Database.SqlQuery<Guid>($"""
        SELECT "TaskId" AS "Value" FROM "Referral"."TaskReference" WHERE "StepId" = {fixture.StepId}
        """).ToListAsync(TestContext.Current.CancellationToken);
      Assert.Equal(fixture.RetainedIds.Order(), retainedReferences.Order());
      Assert.DoesNotContain(persisted, item => item.OpportunityId == null);
    }
    #endregion

    #region Private Members
    private static ApplicationDbContext CreateContext()
    {
      var connectionString = System.Environment.GetEnvironmentVariable("YOMA_REFERRAL_PATHWAY_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(connectionString),
        "Set YOMA_REFERRAL_PATHWAY_TEST_CONNECTION to an isolated local yoma_referral_pathway_* database.");
      var builder = new NpgsqlConnectionStringBuilder(connectionString);
      Assert.True(builder.Host is "localhost" or "127.0.0.1");
      Assert.StartsWith("yoma_referral_pathway_", builder.Database);

      return new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(builder.ConnectionString, options => options.EnableRetryOnFailure(1, TimeSpan.Zero, null)).Options);
    }

    private static ProgramPathwayTask Clone(ProgramPathwayTask item)
    {
      return new ProgramPathwayTask
      {
        Id = item.Id,
        StepId = item.StepId,
        EntityType = item.EntityType,
        Opportunity = item.Opportunity == null ? null : new OpportunityItem { Id = item.Opportunity.Id },
        Order = item.Order,
        OrderDisplay = item.OrderDisplay,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified
      };
    }

    private static void AssertAssignments(Fixture fixture, List<ProgramPathwayTask> persisted)
    {
      var requests = fixture.Request.Pathway!.Steps[0].Tasks;
      Assert.Equal(requests.Count, persisted.Count);
      foreach (var (First, Second) in requests.Zip(persisted.OrderBy(item => item.OrderDisplay)))
      {
        if (First.Id.HasValue) Assert.Equal(First.Id.Value, Second.Id);
        else Assert.DoesNotContain(Second.Id, fixture.OriginalIds);
        Assert.NotEqual(Guid.Empty, Second.Id);
        Assert.Equal(First.EntityId, Second.Opportunity!.Id);
      }
      Assert.Equal(Enumerable.Range(1, requests.Count), persisted.OrderBy(item => item.OrderDisplay).Select(item => (int)item.OrderDisplay));
      Assert.Equal(persisted.Select(item => item.OrderDisplay), persisted.Select(item => item.Order!.Value));
    }

    private static async Task CreateFixtureTables(ApplicationDbContext context)
    {
      var entity = context.Model.FindEntityType(typeof(TaskEntity))!;
      Assert.True(entity.FindProperty(nameof(TaskEntity.OpportunityId))!.IsNullable);
      Assert.Contains(entity.GetIndexes(), index => index.IsUnique && index.Properties.Select(property => property.Name)
        .SequenceEqual([nameof(TaskEntity.StepId), nameof(TaskEntity.EntityType), nameof(TaskEntity.OpportunityId)]));
      Assert.Empty(entity.GetReferencingForeignKeys());
      await context.Database.ExecuteSqlRawAsync("""
        CREATE SCHEMA IF NOT EXISTS "Referral";
        CREATE SCHEMA IF NOT EXISTS "Opportunity";
        CREATE SCHEMA IF NOT EXISTS "Entity";
        CREATE SCHEMA IF NOT EXISTS "Object";
        CREATE TABLE IF NOT EXISTS "Opportunity"."Opportunity" ("Id" uuid PRIMARY KEY);
        ALTER TABLE "Opportunity"."Opportunity" ADD COLUMN IF NOT EXISTS "OrganizationId" uuid;
        ALTER TABLE "Opportunity"."Opportunity" ADD COLUMN IF NOT EXISTS "StatusId" uuid;
        ALTER TABLE "Opportunity"."Opportunity" ADD COLUMN IF NOT EXISTS "TypeId" uuid;
        CREATE TABLE IF NOT EXISTS "Entity"."Organization" ("Id" uuid PRIMARY KEY, "LogoId" uuid, "StatusId" uuid);
        CREATE TABLE IF NOT EXISTS "Object"."Blob" ("Id" uuid PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS "Entity"."OrganizationStatus" ("Id" uuid PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS "Opportunity"."OpportunityStatus" ("Id" uuid PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS "Opportunity"."OpportunityType" ("Id" uuid PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS "Referral"."ProgramPathwayStep" ("Id" uuid PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS "Referral"."ProgramPathwayTask" (
          "Id" uuid PRIMARY KEY, "StepId" uuid NOT NULL REFERENCES "Referral"."ProgramPathwayStep"("Id"),
          "EntityType" varchar(25) NOT NULL, "OpportunityId" uuid REFERENCES "Opportunity"."Opportunity"("Id"),
          "Order" smallint, "OrderDisplay" smallint NOT NULL, "DateCreated" timestamptz NOT NULL, "DateModified" timestamptz NOT NULL);
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_ProgramPathwayTask_StepId_EntityType_OpportunityId"
          ON "Referral"."ProgramPathwayTask" ("StepId", "EntityType", "OpportunityId");
        CREATE TABLE IF NOT EXISTS "Referral"."TaskReference" (
          "TaskId" uuid PRIMARY KEY REFERENCES "Referral"."ProgramPathwayTask"("Id") ON DELETE RESTRICT,
          "StepId" uuid NOT NULL);
        """, TestContext.Current.CancellationToken);
    }

    private static async Task Seed(ApplicationDbContext context, Fixture fixture)
    {
      await context.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO "Referral"."ProgramPathwayStep" ("Id") VALUES ({fixture.StepId});
        """, TestContext.Current.CancellationToken);
      foreach (var id in fixture.Opportunities.Keys)
        await context.Database.ExecuteSqlInterpolatedAsync($"""
          INSERT INTO "Opportunity"."Opportunity" ("Id") VALUES ({id});
          """, TestContext.Current.CancellationToken);
      foreach (var task in fixture.Program.Pathway!.Steps![0].Tasks!)
      {
        await context.Database.ExecuteSqlInterpolatedAsync($"""
          INSERT INTO "Referral"."ProgramPathwayTask"
            ("Id", "StepId", "EntityType", "OpportunityId", "Order", "OrderDisplay", "DateCreated", "DateModified")
          VALUES ({task.Id}, {task.StepId}, {task.EntityType.ToString()}, {task.Opportunity!.Id},
            {task.Order}, {task.OrderDisplay}, {task.DateCreated}, {task.DateModified});
          """, TestContext.Current.CancellationToken);
        if (fixture.RetainedIds.Contains(task.Id))
          await context.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "Referral"."TaskReference" ("TaskId", "StepId") VALUES ({task.Id}, {task.StepId});
            """, TestContext.Current.CancellationToken);
      }
    }
    #endregion

    #region Fixture
    private sealed class Fixture
    {
      internal ProgramServiceFixture Mock { get; } = new("testuser@example.com", Constants.Role_Admin);
      internal Guid StepId { get; } = Guid.NewGuid();
      internal Program Program { get; }
      internal ProgramRequestUpdate Request { get; }
      internal Dictionary<Guid, Opportunity> Opportunities { get; } = [];
      internal List<Guid> OriginalIds { get; }
      internal List<Guid> RetainedIds => [.. Request.Pathway!.Steps[0].Tasks.Where(item => item.Id.HasValue).Select(item => item.Id!.Value)];

      internal Fixture(string scenario)
      {
        var count = scenario == "cycle-four" ? 4 : scenario is "cycle-three" or "remove-add" ? 3 : 2;
        var now = DateTimeOffset.UtcNow;
        for (var index = 0; index <= count; index++)
        {
          var opportunity = new Opportunity
          {
            Id = Guid.NewGuid(),
            Title = $"Opportunity {index}",
            OrganizationName = "Organization",
            OrganizationStatus = OrganizationStatus.Active,
            Status = Domain.Opportunity.Status.Active,
            Type = Domain.Opportunity.Type.Learning,
            DateStart = now.AddDays(-30),
            VerificationEnabled = true,
            VerificationMethod = Domain.Opportunity.VerificationMethod.Manual
          };
          Opportunities.Add(opportunity.Id, opportunity);
        }
        var opportunityIds = Opportunities.Keys.ToList();
        var pathwayId = Guid.NewGuid();
        var step = new ProgramPathwayStep
        {
          Id = StepId,
          PathwayId = pathwayId,
          Name = "Step",
          Rule = PathwayCompletionRule.All,
          OrderMode = PathwayOrderMode.Sequential,
          Order = 1,
          OrderDisplay = 1,
          Tasks = []
        };
        for (var index = 0; index < count; index++)
          step.Tasks.Add(new ProgramPathwayTask
          {
            Id = Guid.NewGuid(),
            StepId = StepId,
            EntityType = PathwayTaskEntityType.Opportunity,
            Opportunity = new OpportunityItem
            {
              Id = opportunityIds[index],
              Title = $"Opportunity {index}",
              OrganizationStatus = OrganizationStatus.Active,
              Status = Domain.Opportunity.Status.Active,
              Type = Domain.Opportunity.Type.Learning,
              DateStart = now.AddDays(-30),
              VerificationEnabled = true,
              VerificationMethod = Domain.Opportunity.VerificationMethod.Manual
            },
            Order = (short)(index + 1),
            OrderDisplay = (short)(index + 1),
            DateCreated = new DateTimeOffset(2024, 1, 1, 0, 0, 0, TimeSpan.Zero),
            DateModified = new DateTimeOffset(2024, 1, 2, 0, 0, 0, TimeSpan.Zero)
          });
        OriginalIds = [.. step.Tasks.Select(item => item.Id)];
        var country = new Domain.Lookups.Models.Country
        {
          Id = Guid.NewGuid(),
          Name = Country.Worldwide.ToString(),
          CodeAlpha2 = Country.Worldwide.ToDescription()
        };
        Program = new ProgramBuilder().WithPathwayRequired(true)
          .WithCountries([country])
          .WithDateStart(new DateTimeOffset(now.Date, TimeSpan.Zero).AddDays(-1))
          .WithPathway(new ProgramPathway
          {
            Id = pathwayId,
            Name = "Pathway",
            Rule = PathwayCompletionRule.All,
            OrderMode = PathwayOrderMode.Sequential,
            Steps = [step]
          }).Build();
        var tasks = step.Tasks.Select(item => new ProgramPathwayTaskRequestUpsert
        { Id = item.Id, EntityType = item.EntityType, EntityId = item.Opportunity!.Id }).ToList();
        switch (scenario)
        {
          case "swap": tasks[0].EntityId = opportunityIds[1]; tasks[1].EntityId = opportunityIds[0]; break;
          case "cycle-three":
          case "cycle-four":
            for (var index = 0; index < count; index++) tasks[index].EntityId = opportunityIds[(index + 1) % count];
            break;
          case "replacement": tasks[0].EntityId = opportunityIds[count]; break;
          case "display-order": tasks.Reverse(); break;
          case "remove-add":
            tasks.RemoveAt(1);
            tasks[0].EntityId = opportunityIds[1];
            tasks[1].EntityId = opportunityIds[0];
            tasks.Add(new ProgramPathwayTaskRequestUpsert { EntityType = PathwayTaskEntityType.Opportunity, EntityId = opportunityIds[2] });
            break;
          case "unchanged": break;
          default: throw new NotSupportedException($"Scenario '{scenario}' is not supported");
        }
        Request = new ProgramRequestUpdate
        {
          Id = Program.Id,
          Name = Program.Name,
          Summary = Program.Summary,
          Description = Program.Description,
          DateStart = Program.DateStart,
          CompletionWindowInDays = 30,
          PathwayRequired = true,
          Countries = [country.Id],
          Pathway = new ProgramPathwayRequestUpsert
          {
            Id = pathwayId,
            Name = "Pathway",
            Rule = PathwayCompletionRule.All,
            OrderMode = PathwayOrderMode.Sequential,
            Steps = [new ProgramPathwayStepRequestUpsert
            {
              Id = StepId, Name = "Step", Rule = PathwayCompletionRule.All, OrderMode = PathwayOrderMode.Sequential, Tasks = tasks
            }]
          }
        };
        Mock.ProgramRequestValidatorUpdate.CallBase = true;
        Mock.CountryService.Setup(service => service.GetById(country.Id)).Returns(country);
        Mock.CountryService.Setup(service => service.GetByIdOrNull(country.Id)).Returns(country);
        Mock.CountryService.Setup(service => service.List(It.IsAny<bool?>())).Returns([country]);
        Mock.ProgramRepository.Setup(repository => repository.Query(It.IsAny<bool>())).Returns(new[] { Program }.AsQueryable());
        Mock.UserService.Setup(service => service.GetByUsername(It.IsAny<string>(), false, false)).Returns(new UserBuilder().Build());
        Mock.OpportunityService.Setup(service => service.GetById(It.IsAny<Guid>(), true, true, false))
          .Returns((Guid id, bool _, bool _, bool _, LockMode? _) => Opportunities[id]);
      }
    }

    private sealed class ProbeException : Exception { }
    #endregion
  }
}
