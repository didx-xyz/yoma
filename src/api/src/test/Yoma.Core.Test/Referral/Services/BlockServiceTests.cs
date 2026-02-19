using Moq;
using Xunit;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Test.Referral.Builders;
using Yoma.Core.Test.Referral.Fixtures;

namespace Yoma.Core.Test.Referral.Services
{
  [Trait("Category", "Referral")]
  public class BlockServiceTests
  {
    #region Block
    [Fact]
    public async Task Block_HappyPath_CreatesActiveBlock()
    {
      // Arrange
      var fixture = new BlockServiceFixture();
      var userId = Guid.NewGuid();
      var user = new UserBuilder().WithId(userId).Build();

      fixture.UserService
        .Setup(x => x.GetById(userId, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);
      fixture.UserService
        .Setup(x => x.GetByUsername(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      var request = new BlockRequest
      {
        UserId = userId,
        ReasonId = LookupBuilder.BlockReasonOtherId,
        Comment = "Test block",
        CancelLinks = false
      };

      var service = fixture.Build();

      // Act
      var result = await service.Block(request);

      // Assert
      Assert.NotNull(result);
      Assert.True(result.Active);
      fixture.BlockRepository.Verify(
        r => r.Create(It.Is<Block>(b => b.Active == true && b.UserId == userId)),
        Times.Once);
    }

    [Fact]
    public async Task Block_AlreadyBlocked_ReturnsExistingBlock()
    {
      // Arrange
      var fixture = new BlockServiceFixture();
      var userId = Guid.NewGuid();
      var user = new UserBuilder().WithId(userId).Build();

      fixture.UserService
        .Setup(x => x.GetById(userId, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);
      fixture.UserService
        .Setup(x => x.GetByUsername(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      // Setup existing active block
      var block = new BlockBuilder().WithUserId(userId).AsActive().Build();
      var blocks = new List<Block> { block }.AsQueryable();
      fixture.BlockRepository.Setup(r => r.Query()).Returns(blocks);

      var request = new BlockRequest
      {
        UserId = userId,
        ReasonId = LookupBuilder.BlockReasonOtherId,
        Comment = "Test block",
        CancelLinks = false
      };

      var service = fixture.Build();

      // Act
      var result = await service.Block(request);

      // Assert
      Assert.Equal(block.Id, result.Id);
      fixture.BlockRepository.Verify(
        r => r.Create(It.IsAny<Block>()),
        Times.Never);
    }

    [Fact]
    public async Task Block_CancelLinks_CancelsUserLinks()
    {
      // Arrange
      var fixture = new BlockServiceFixture();
      var userId = Guid.NewGuid();
      var user = new UserBuilder().WithId(userId).Build();

      fixture.UserService
        .Setup(x => x.GetById(userId, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);
      fixture.UserService
        .Setup(x => x.GetByUsername(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      var request = new BlockRequest
      {
        UserId = userId,
        ReasonId = LookupBuilder.BlockReasonOtherId,
        Comment = "Test block",
        CancelLinks = true
      };

      var service = fixture.Build();

      // Act
      await service.Block(request);

      // Assert
      fixture.LinkMaintenanceService.Verify(
        x => x.CancelByUserId(userId),
        Times.Once);
    }

    [Fact]
    public async Task Block_NoCancelLinks_DoesNotCancelLinks()
    {
      // Arrange
      var fixture = new BlockServiceFixture();
      var userId = Guid.NewGuid();
      var user = new UserBuilder().WithId(userId).Build();

      fixture.UserService
        .Setup(x => x.GetById(userId, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);
      fixture.UserService
        .Setup(x => x.GetByUsername(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      var request = new BlockRequest
      {
        UserId = userId,
        ReasonId = LookupBuilder.BlockReasonOtherId,
        Comment = "Test block",
        CancelLinks = false
      };

      var service = fixture.Build();

      // Act
      await service.Block(request);

      // Assert
      fixture.LinkMaintenanceService.Verify(
        x => x.CancelByUserId(It.IsAny<Guid>()),
        Times.Never);
    }
    #endregion

    #region Unblock
    [Fact]
    public async Task Unblock_HappyPath_DeactivatesBlock()
    {
      // Arrange
      var fixture = new BlockServiceFixture();
      var userId = Guid.NewGuid();
      var user = new UserBuilder().WithId(userId).Build();

      fixture.UserService
        .Setup(x => x.GetById(userId, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);
      fixture.UserService
        .Setup(x => x.GetByUsername(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      // Setup existing active block
      var block = new BlockBuilder().WithUserId(userId).AsActive().Build();
      var blocks = new List<Block> { block }.AsQueryable();
      fixture.BlockRepository.Setup(r => r.Query()).Returns(blocks);

      var request = new UnblockRequest
      {
        UserId = userId,
        Comment = "Unblocking"
      };

      var service = fixture.Build();

      // Act
      await service.Unblock(request);

      // Assert
      fixture.BlockRepository.Verify(
        r => r.Update(It.Is<Block>(b => b.Active == false)),
        Times.Once);
    }

    [Fact]
    public async Task Unblock_NotBlocked_ReturnsWithoutError()
    {
      // Arrange
      var fixture = new BlockServiceFixture();
      var userId = Guid.NewGuid();
      var user = new UserBuilder().WithId(userId).Build();

      fixture.UserService
        .Setup(x => x.GetById(userId, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);
      fixture.UserService
        .Setup(x => x.GetByUsername(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      // No active block in repo (default empty queryable from fixture)

      var request = new UnblockRequest
      {
        UserId = userId,
        Comment = "Unblocking"
      };

      var service = fixture.Build();

      // Act — should not throw
      var exception = await Record.ExceptionAsync(() => service.Unblock(request));

      // Assert
      Assert.Null(exception);
      fixture.BlockRepository.Verify(
        r => r.Update(It.IsAny<Block>()),
        Times.Never);
    }
    #endregion
  }
}
