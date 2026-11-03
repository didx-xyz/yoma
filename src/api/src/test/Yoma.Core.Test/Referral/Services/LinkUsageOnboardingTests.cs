using Moq;
using Xunit;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Test.Referral.Builders;
using Yoma.Core.Test.Referral.Fixtures;

namespace Yoma.Core.Test.Referral.Services
{
  public class LinkUsageOnboardingTests
  {
    private static readonly bool?[] OnboardingStates = [null, false, true];
    private static readonly bool[] RequirementStates = [false, true];

    public static TheoryData<ReferralLinkUsageStatus, bool?, bool, bool> ProgressCases
    {
      get
      {
        var cases = new TheoryData<ReferralLinkUsageStatus, bool?, bool, bool>();
        foreach (var status in Enum.GetValues<ReferralLinkUsageStatus>())
          foreach (var onboarded in OnboardingStates)
            foreach (var popRequired in RequirementStates)
              foreach (var pathwayRequired in RequirementStates)
                cases.Add(status, onboarded, popRequired, pathwayRequired);
        return cases;
      }
    }

    [Theory]
    [MemberData(nameof(ProgressCases))]
    [Trait("Category", "Referral")]
    public void GetById_OnboardingGuardAndProgressRespectUsageLifecycle(
      ReferralLinkUsageStatus status, bool? onboarded, bool popRequired, bool pathwayRequired)
    {
      var fixture = new LinkUsageServiceFixture();
      var usage = new ReferralLinkUsageBuilder().WithUserYoIDOnboarded(onboarded).Build();
      usage.Status = status;
      var isIntent = status is ReferralLinkUsageStatus.Initiated or ReferralLinkUsageStatus.Abandoned;
      usage.DateClaimed = isIntent ? null : DateTimeOffset.UtcNow.AddDays(-1);
      usage.DateInitiated = DateTimeOffset.UtcNow.AddDays(-2);
      var opportunityId = Guid.NewGuid();
      var pathway = new ProgramPathway
      {
        Id = Guid.NewGuid(),
        Rule = PathwayCompletionRule.All,
        Steps =
        [
          new ProgramPathwayStep
          {
            Id = Guid.NewGuid(),
            Rule = PathwayCompletionRule.All,
            Tasks =
            [
              new ProgramPathwayTask
              {
                Id = Guid.NewGuid(),
                EntityType = PathwayTaskEntityType.Opportunity,
                Opportunity = new Domain.Opportunity.Models.OpportunityItem { Id = opportunityId }
              }
            ]
          }
        ]
      };
      var program = new ProgramBuilder().WithId(usage.ProgramId)
        .WithProofOfPersonhoodRequired(popRequired)
        .WithPathwayRequired(pathwayRequired)
        .WithPathway(pathwayRequired ? pathway : null).Build();
      fixture.LinkUsageRepository.Setup(r => r.Query()).Returns(new[] { usage }.AsQueryable());
      fixture.ProgramService.Setup(s => s.GetById(usage.ProgramId, true, false)).Returns(program);
      fixture.MyOpportunityService.Setup(s => s.GetVerificationStatus(opportunityId, usage.UserId))
        .Returns(new Domain.MyOpportunity.Models.MyOpportunityResponseVerifyStatus
        {
          Status = Domain.MyOpportunity.VerificationStatus.Completed
        });

      var service = fixture.Build();
      if (!isIntent && onboarded != true)
      {
        var error = Assert.Throws<DataInconsistencyException>(() => service.GetById(usage.Id, true, false, false));
        Assert.Equal("Expected YoID onboarded but not completed", error.Message);
        return;
      }

      var result = service.GetById(usage.Id, true, false, false);

      // POP and the pathway are satisfied: missing onboarding must still prevent 100%.
      var expected = onboarded == true ? 100m : ((popRequired ? 1 : 0) + (pathwayRequired ? 2 : 0)) switch
      {
        0 => 0m,
        1 => 50m,
        2 => 66.67m,
        3 => 75m,
        _ => throw new InvalidOperationException("Unsupported requirements")
      };
      Assert.Equal(expected, result.PercentComplete);
      Assert.Equal(status, result.Status);
      Assert.Equal(usage.DateClaimed, result.DateClaimed);
      Assert.Equal(usage.DateInitiated, result.DateInitiated);
      Assert.Equal(usage.ZltoRewardReferee, result.ZltoRewardReferee);
      Assert.Equal(usage.ZltoRewardReferrer, result.ZltoRewardReferrer);
      if (pathwayRequired) Assert.NotNull(result.Pathway);
      fixture.LinkUsageRepository.Verify(r => r.Update(It.IsAny<ReferralLinkUsage>()), Times.Never);
      fixture.RewardService.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(ReferralLinkUsageStatus.Initiated, true)]
    [InlineData(ReferralLinkUsageStatus.Initiated, false)]
    [InlineData(ReferralLinkUsageStatus.Abandoned, true)]
    [InlineData(ReferralLinkUsageStatus.Abandoned, false)]
    public void PreclaimDetails_PreserveOwnershipAndRedaction(ReferralLinkUsageStatus status, bool asReferee)
    {
      const string username = "reader@example.com";
      var fixture = new LinkUsageServiceFixture(username);
      var usage = new ReferralLinkUsageBuilder().WithUserYoIDOnboarded(null).Build();
      usage.Status = status;
      usage.DateClaimed = null;
      var user = new UserBuilder().WithId(asReferee ? usage.UserId : usage.UserIdReferrer).Build();
      fixture.UserService.Setup(s => s.GetByUsername(username, false, false)).Returns(user);
      fixture.LinkUsageRepository.Setup(r => r.Query()).Returns(new[] { usage }.AsQueryable());
      fixture.ProgramService.Setup(s => s.GetById(usage.ProgramId, true, false))
        .Returns(new ProgramBuilder().WithId(usage.ProgramId).Build());
      var service = fixture.Build();

      var result = service.GetById(usage.Id, true, true, false);

      Assert.Equal(0m, result.PercentComplete);
      Assert.Null(result.DateClaimed);
      Assert.Equal(Guid.Empty, asReferee ? result.UserIdReferrer : result.UserId);
      if (asReferee)
      {
        var byProgram = service.GetByProgramIdAsReferee(usage.ProgramId, true);
        Assert.Equal(0m, byProgram.PercentComplete);
        Assert.Equal(Guid.Empty, byProgram.UserIdReferrer);
      }

      user.Id = Guid.NewGuid();
      Assert.Throws<SecurityException>(() => service.GetById(usage.Id, true, true, false));
    }

    [Theory]
    [InlineData(null)]
    [InlineData(false)]
    public async Task ProcessProgress_NotOnboarded_DoesNotProcessOrAward(bool? onboarded)
    {
      var fixture = new LinkUsageServiceFixture();
      var user = new UserBuilder().Build();
      user.YoIDOnboarded = onboarded;
      fixture.UserService.Setup(s => s.GetById(user.Id, false, false)).Returns(user);

      await fixture.Build().ProcessProgressByUserId(user.Id);

      fixture.LinkUsageRepository.VerifyNoOtherCalls();
      fixture.RewardService.VerifyNoOtherCalls();
      fixture.TreasuryService.VerifyNoOtherCalls();
    }
  }
}
