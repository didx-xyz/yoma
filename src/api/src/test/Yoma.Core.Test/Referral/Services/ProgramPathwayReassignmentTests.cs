using FluentValidation;
using Moq;
using System.Transactions;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Test.Referral.Builders;
using Yoma.Core.Test.Referral.Fixtures;
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

    #endregion

    #region Private Members

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

    #endregion
  }
}
