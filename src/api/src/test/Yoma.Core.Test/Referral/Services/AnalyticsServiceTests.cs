using Moq;
using Xunit;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Test.Referral.Builders;
using Yoma.Core.Test.Referral.Fixtures;

namespace Yoma.Core.Test.Referral.Services
{
  [Trait("Category", "Referral")]
  public class AnalyticsServiceTests
  {
    #region ByUser
    [Fact]
    public void ByUser_Referrer_NoData_ReturnsDefaultAnalytics()
    {
      // Arrange
      var fixture = new AnalyticsServiceFixture("testuser@example.com");
      var userId = Guid.NewGuid();
      var user = new UserBuilder()
        .WithId(userId)
        .WithUsername("testuser@example.com")
        .Build();

      fixture.UserService
        .Setup(x => x.GetByUsername("testuser@example.com", It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      var service = fixture.Build();

      // Act
      var result = service.ByUser(ReferralParticipationRole.Referrer);

      // Assert
      Assert.NotNull(result);
      Assert.Equal(userId, result.UserId);
      Assert.Equal(0, result.UsageCountCompleted);
      Assert.Equal(0, result.UsageCountPending);
      Assert.Equal(0, result.UsageCountExpired);
      Assert.Equal(0m, result.ZltoRewardTotal);
    }

    [Fact]
    public void ByUser_Referee_NoData_ReturnsDefaultAnalytics()
    {
      // Arrange
      var fixture = new AnalyticsServiceFixture("testuser@example.com");
      var userId = Guid.NewGuid();
      var user = new UserBuilder()
        .WithId(userId)
        .WithUsername("testuser@example.com")
        .Build();

      fixture.UserService
        .Setup(x => x.GetByUsername("testuser@example.com", It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      var service = fixture.Build();

      // Act
      var result = service.ByUser(ReferralParticipationRole.Referee);

      // Assert
      Assert.NotNull(result);
      Assert.Equal(userId, result.UserId);
      Assert.Equal(0, result.UsageCountCompleted);
      Assert.Equal(0, result.UsageCountPending);
      Assert.Equal(0, result.UsageCountExpired);
      Assert.Equal(0m, result.ZltoRewardTotal);
    }

    [Fact]
    public void ByUser_Referrer_WithData_ReturnsCorrectAnalytics()
    {
      // Arrange
      var fixture = new AnalyticsServiceFixture("referrer@example.com");
      var userId = Guid.NewGuid();
      var programId = Guid.NewGuid();
      var user = new UserBuilder()
        .WithId(userId)
        .WithUsername("referrer@example.com")
        .Build();

      fixture.UserService
        .Setup(x => x.GetByUsername("referrer@example.com", It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      // Setup links owned by the referrer
      var link = new ReferralLinkBuilder()
        .WithUserId(userId)
        .WithProgramId(programId)
        .WithUsername("referrer@example.com")
        .WithStatus(ReferralLinkStatus.Active)
        .WithCompletionTotal(2)
        .Build();

      var links = new List<ReferralLink> { link }.AsQueryable();
      fixture.LinkRepository.Setup(r => r.Query()).Returns(links);
      fixture.LinkRepository.Setup(r => r.Query(It.IsAny<bool>())).Returns(links);
      fixture.LinkRepository.Setup(r => r.Query(It.IsAny<bool>(), It.IsAny<Domain.Core.LockMode>())).Returns(links);

      // Setup usages for the referrer's links
      var usage1 = new ReferralLinkUsageBuilder()
        .FromLink(link)
        .WithStatus(ReferralLinkUsageStatus.Completed)
        .WithZltoRewardReferrer(10m)
        .Build();

      var usage2 = new ReferralLinkUsageBuilder()
        .FromLink(link)
        .WithStatus(ReferralLinkUsageStatus.Completed)
        .WithZltoRewardReferrer(15m)
        .Build();

      var usage3 = new ReferralLinkUsageBuilder()
        .FromLink(link)
        .WithStatus(ReferralLinkUsageStatus.Pending)
        .Build();

      var usages = new List<ReferralLinkUsage> { usage1, usage2, usage3 }.AsQueryable();
      fixture.LinkUsageRepository.Setup(r => r.Query()).Returns(usages);
      fixture.LinkUsageRepository.Setup(r => r.Query(It.IsAny<Domain.Core.LockMode>())).Returns(usages);

      var service = fixture.Build();

      // Act
      var result = service.ByUser(ReferralParticipationRole.Referrer);

      // Assert
      Assert.NotNull(result);
      Assert.Equal(userId, result.UserId);
      Assert.Equal(2, result.UsageCountCompleted);
      Assert.Equal(1, result.LinkCount);
      Assert.Equal(1, result.LinkCountActive);
      Assert.Equal(25m, result.ZltoRewardTotal);
    }
    #endregion
  }
}
