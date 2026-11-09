using Moq;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Reward;
using Yoma.Core.Test.Referral.Builders;
using Yoma.Core.Test.Referral.Fixtures;

namespace Yoma.Core.Test.Referral.Services
{
  public class LinkUsageCompletionTests
  {
    [Theory]
    [InlineData(PathwayCompletionRule.All, PathwayCompletionRule.Any, false)]
    [InlineData(PathwayCompletionRule.Any, PathwayCompletionRule.All, true)]
    [InlineData(PathwayCompletionRule.Any, PathwayCompletionRule.Any, false)]
    [InlineData(PathwayCompletionRule.All, PathwayCompletionRule.All, true)]
    public async Task ProcessProgress_SatisfiedPathway_CompletesAndSchedulesRewardsOnlyOnce(
      PathwayCompletionRule pathwayRule, PathwayCompletionRule stepRule, bool completeAllTasks)
    {
      var (fixture, usage, program, link) = CreateFixture(pathwayRule, stepRule, completeAllTasks);
      var service = fixture.Build();

      var progress = service.GetById(usage.Id, true, false, false);
      Assert.True(progress.PathwayCompleted);
      Assert.Equal(100m, progress.PercentComplete);

      await service.ProcessProgressByUserId(usage.UserId);
      await service.ProcessProgressByUserId(usage.UserId);

      Assert.Equal(ReferralLinkUsageStatus.Completed, usage.Status);
      Assert.Equal(LookupBuilder.UsageStatusCompletedId, usage.StatusId);
      Assert.Equal(10m, usage.ZltoRewardReferee);
      Assert.Equal(20m, usage.ZltoRewardReferrer);
      fixture.LinkUsageRepository.Verify(r => r.Update(usage), Times.Once);
      fixture.ProgramService.Verify(s => s.ProcessCompletion(program, 30m), Times.Once);
      fixture.LinkService.Verify(s => s.ProcessCompletion(program, link, 30m), Times.Once);
      fixture.TreasuryService.Verify(s => s.ZltoRewardAwarded(It.IsAny<Domain.Treasury.Models.Treasury>(), 30m), Times.Once);
      fixture.RewardService.Verify(s => s.ScheduleTransaction(
        usage.UserId, RewardTransactionEntityType.ReferralLinkUsage, usage.Id, 10m), Times.Once);
      fixture.RewardService.Verify(s => s.ScheduleTransaction(
        usage.UserIdReferrer, RewardTransactionEntityType.ReferralLinkUsage, usage.Id, 20m), Times.Once);
      fixture.RewardService.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(PathwayCompletionRule.All, PathwayCompletionRule.All, false)]
    [InlineData(PathwayCompletionRule.Any, PathwayCompletionRule.All, false)]
    public async Task ProcessProgress_RequiredTasksOutstanding_RemainsPending(
      PathwayCompletionRule pathwayRule, PathwayCompletionRule stepRule, bool completeAllTasks)
    {
      var (fixture, usage, _, _) = CreateFixture(pathwayRule, stepRule, completeAllTasks);

      await fixture.Build().ProcessProgressByUserId(usage.UserId);

      Assert.Equal(ReferralLinkUsageStatus.Pending, usage.Status);
      AssertNoCompletionWrites(fixture);
    }

    [Fact]
    public async Task ProcessProgress_RequiredStepOutstanding_RemainsPending()
    {
      var (fixture, usage, program, _) = CreateFixture(PathwayCompletionRule.Any, PathwayCompletionRule.Any, false);
      program.Pathway!.Rule = PathwayCompletionRule.All;

      await fixture.Build().ProcessProgressByUserId(usage.UserId);

      Assert.Equal(ReferralLinkUsageStatus.Pending, usage.Status);
      AssertNoCompletionWrites(fixture);
    }

    [Theory]
    [InlineData(ReferralLinkUsageStatus.Completed)]
    [InlineData(ReferralLinkUsageStatus.Expired)]
    [InlineData(ReferralLinkUsageStatus.Abandoned)]
    [InlineData(ReferralLinkUsageStatus.Initiated)]
    public async Task ProcessProgress_NotPending_DoesNotReopenOrAward(ReferralLinkUsageStatus status)
    {
      var (fixture, usage, _, _) = CreateFixture(PathwayCompletionRule.Any, PathwayCompletionRule.Any, false);
      usage.Status = status;
      usage.StatusId = fixture.LinkUsageStatusService.Object.GetByName(status.ToString()).Id;

      await fixture.Build().ProcessProgressByUserId(usage.UserId);

      Assert.Equal(status, usage.Status);
      AssertNoCompletionWrites(fixture);
    }

    [Fact]
    public async Task ProcessProgress_PendingPastWindow_ExpiresWithoutAwarding()
    {
      var (fixture, usage, _, _) = CreateFixture(PathwayCompletionRule.Any, PathwayCompletionRule.Any, false);
      usage.DateClaimed = DateTimeOffset.UtcNow.AddDays(-31);

      await fixture.Build().ProcessProgressByUserId(usage.UserId);

      Assert.Equal(ReferralLinkUsageStatus.Expired, usage.Status);
      fixture.LinkUsageRepository.Verify(r => r.Update(usage), Times.Once);
      fixture.RewardService.VerifyNoOtherCalls();
      fixture.TreasuryService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ProcessProgress_ProofOfPersonhoodOutstanding_RemainsPending()
    {
      var (fixture, usage, program, _) = CreateFixture(PathwayCompletionRule.Any, PathwayCompletionRule.Any, false);
      program.ProofOfPersonhoodRequired = true;
      usage.UserPhoneNumberConfirmed = false;

      await fixture.Build().ProcessProgressByUserId(usage.UserId);

      Assert.Equal(ReferralLinkUsageStatus.Pending, usage.Status);
      AssertNoCompletionWrites(fixture);
    }

    [Theory]
    [InlineData(0, 0, 0)]
    [InlineData(12, 10, 2)]
    [InlineData(30, 10, 20)]
    public async Task ProcessProgress_AnyCompletionStillHonoursRewardPool(int pool, int refereeReward, int referrerReward)
    {
      var (fixture, usage, program, _) = CreateFixture(PathwayCompletionRule.Any, PathwayCompletionRule.Any, false);
      program.ZltoRewardPool = pool;

      await fixture.Build().ProcessProgressByUserId(usage.UserId);

      Assert.Equal(ReferralLinkUsageStatus.Completed, usage.Status);
      Assert.Equal(refereeReward, usage.ZltoRewardReferee);
      Assert.Equal(referrerReward, usage.ZltoRewardReferrer);
      fixture.RewardService.Verify(s => s.ScheduleTransaction(usage.UserId,
        RewardTransactionEntityType.ReferralLinkUsage, usage.Id, refereeReward), Times.Exactly(refereeReward > 0 ? 1 : 0));
      fixture.RewardService.Verify(s => s.ScheduleTransaction(usage.UserIdReferrer,
        RewardTransactionEntityType.ReferralLinkUsage, usage.Id, referrerReward), Times.Exactly(referrerReward > 0 ? 1 : 0));
      fixture.RewardService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ProcessProgress_AnyCompletionWithReachedLimit_DoesNotAwardRewards()
    {
      var (fixture, usage, program, _) = CreateFixture(PathwayCompletionRule.Any, PathwayCompletionRule.Any, false);
      program.Status = ProgramStatus.LimitReached;

      await fixture.Build().ProcessProgressByUserId(usage.UserId);

      Assert.Equal(ReferralLinkUsageStatus.Completed, usage.Status);
      Assert.Null(usage.ZltoRewardReferee);
      Assert.Null(usage.ZltoRewardReferrer);
      fixture.RewardService.VerifyNoOtherCalls();
      fixture.ProgramService.Verify(s => s.ProcessCompletion(program, null), Times.Once);
    }

    [Fact]
    public async Task ProcessProgress_StatusChangesAfterWorklist_DoesNotAwardAgain()
    {
      var (fixture, usage, _, _) = CreateFixture(PathwayCompletionRule.Any, PathwayCompletionRule.Any, false);
      fixture.LinkUsageRepository.Setup(r => r.Query(LockMode.Wait)).Returns(() =>
      {
        usage.Status = ReferralLinkUsageStatus.Completed;
        usage.StatusId = LookupBuilder.UsageStatusCompletedId;
        return new[] { usage }.AsQueryable();
      });

      await fixture.Build().ProcessProgressByUserId(usage.UserId);

      Assert.Equal(ReferralLinkUsageStatus.Completed, usage.Status);
      AssertNoCompletionWrites(fixture);
    }

    private static void AssertNoCompletionWrites(LinkUsageServiceFixture fixture)
    {
      fixture.LinkUsageRepository.Verify(r => r.Update(It.IsAny<ReferralLinkUsage>()), Times.Never);
      fixture.ProgramService.Verify(s => s.ProcessCompletion(It.IsAny<Program>(), It.IsAny<decimal?>()), Times.Never);
      fixture.LinkService.Verify(s => s.ProcessCompletion(It.IsAny<Program>(), It.IsAny<ReferralLink>(), It.IsAny<decimal?>()), Times.Never);
      fixture.TreasuryService.VerifyNoOtherCalls();
      fixture.RewardService.VerifyNoOtherCalls();
    }

    private static (LinkUsageServiceFixture Fixture, ReferralLinkUsage Usage, Program Program, ReferralLink Link) CreateFixture(
      PathwayCompletionRule pathwayRule, PathwayCompletionRule stepRule, bool completeAllTasks)
    {
      var fixture = new LinkUsageServiceFixture();
      var usage = new ReferralLinkUsageBuilder().WithDateClaimed(DateTimeOffset.UtcNow.AddDays(-2)).Build();
      var user = new UserBuilder().WithId(usage.UserId).Build();
      var pathway = new ProgramPathway
      {
        Id = Guid.NewGuid(),
        Rule = pathwayRule,
        Steps =
        [
          new ProgramPathwayStep
          {
            Id = Guid.NewGuid(),
            Rule = stepRule,
            Tasks = [CreateTask(), CreateTask()]
          }
        ]
      };
      if (pathwayRule == PathwayCompletionRule.Any)
        pathway.Steps.Add(new ProgramPathwayStep
        {
          Id = Guid.NewGuid(),
          Rule = PathwayCompletionRule.All,
          Tasks = [CreateTask()]
        });

      var program = new ProgramBuilder().WithId(usage.ProgramId)
        .WithPathwayRequired(true).WithPathway(pathway)
        .WithZltoRewardReferee(10m).WithZltoRewardReferrer(20m).Build();
      var link = new ReferralLinkBuilder().WithId(usage.LinkId).WithProgramId(program.Id).Build();
      var treasury = new Domain.Treasury.Models.Treasury();

      fixture.UserService.Setup(s => s.GetById(user.Id, false, false)).Returns(user);
      fixture.LinkUsageRepository.Setup(r => r.Query()).Returns(new[] { usage }.AsQueryable());
      fixture.LinkUsageRepository.Setup(r => r.Query(LockMode.Wait)).Returns(new[] { usage }.AsQueryable());
      fixture.ProgramService.Setup(s => s.GetById(program.Id, true, false)).Returns(program);
      fixture.ProgramService.Setup(s => s.GetById(program.Id, false, false, LockMode.Wait)).Returns(program);
      fixture.ProgramService.Setup(s => s.ProcessCompletion(program, It.IsAny<decimal?>())).ReturnsAsync(program);
      fixture.LinkService.Setup(s => s.GetById(link.Id, false, false, false, false, false, LockMode.Wait)).Returns(link);
      fixture.LinkService.Setup(s => s.ProcessCompletion(program, link, It.IsAny<decimal?>())).ReturnsAsync(link);
      fixture.TreasuryService.Setup(s => s.Get(LockMode.Wait)).Returns(treasury);

      foreach (var step in pathway.Steps)
        foreach (var task in step.Tasks!)
        {
          var completed = step == pathway.Steps[0] && (completeAllTasks || task == step.Tasks[0]);
          fixture.MyOpportunityService.Setup(s => s.GetVerificationStatus(task.Opportunity!.Id, usage.UserId))
            .Returns(new Domain.MyOpportunity.Models.MyOpportunityResponseVerifyStatus
            {
              Status = completed ? Domain.MyOpportunity.VerificationStatus.Completed : Domain.MyOpportunity.VerificationStatus.Pending,
              DateCompleted = completed ? DateTimeOffset.UtcNow.AddDays(-1) : null
            });
        }

      return (fixture, usage, program, link);
    }

    private static ProgramPathwayTask CreateTask()
    {
      return new ProgramPathwayTask
      {
        Id = Guid.NewGuid(),
        EntityType = PathwayTaskEntityType.Opportunity,
        Opportunity = new Domain.Opportunity.Models.OpportunityItem { Id = Guid.NewGuid() }
      };
    }
  }
}
