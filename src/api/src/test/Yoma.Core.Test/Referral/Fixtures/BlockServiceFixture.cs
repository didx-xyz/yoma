using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Services;
using Yoma.Core.Domain.Referral.Validators;

namespace Yoma.Core.Test.Referral.Fixtures
{
  public class BlockServiceFixture
  {
    #region Public Properties – Mocks
    public Mock<ILogger<BlockService>> Logger { get; }
    public Mock<IHttpContextAccessor> HttpContextAccessor { get; }
    public Mock<IUserService> UserService { get; }
    public Mock<IBlockReasonService> BlockReasonService { get; }
    public Mock<ILinkMaintenanceService> LinkMaintenanceService { get; }
    public Mock<INotificationDeliveryService> NotificationDeliveryService { get; }
    public Mock<IExecutionStrategyService> ExecutionStrategyService { get; }
    public Mock<BlockRequestValidator> BlockRequestValidator { get; }
    public Mock<UnblockRequestValidator> UnblockRequestValidator { get; }
    public Mock<IRepository<Block>> BlockRepository { get; }
    #endregion

    #region Constructor
    public BlockServiceFixture(string username = "testuser@example.com", params string[] roles)
    {
      Logger = new Mock<ILogger<BlockService>>();
      HttpContextAccessor = MockHttpContextAccessor.Create(username, roles);

      UserService = new Mock<IUserService>();
      BlockReasonService = MockLookupServices.CreateBlockReasonService();
      LinkMaintenanceService = new Mock<ILinkMaintenanceService>();
      NotificationDeliveryService = new Mock<INotificationDeliveryService>();

      ExecutionStrategyService = new Mock<IExecutionStrategyService>();
      ExecutionStrategyService
        .Setup(x => x.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>()))
        .Returns<Func<Task>>(async action => await action());
      ExecutionStrategyService
        .Setup(x => x.ExecuteInExecutionStrategy(It.IsAny<Action>()))
        .Callback<Action>(action => action());

      BlockRequestValidator = new Mock<BlockRequestValidator>(BlockReasonService.Object) { CallBase = false };
      UnblockRequestValidator = new Mock<UnblockRequestValidator>() { CallBase = false };

      BlockRepository = new Mock<IRepository<Block>>();
      SetupRepository(BlockRepository);
    }
    #endregion

    #region Public Members
    public BlockService Build()
    {
      return new BlockService(
        Logger.Object,
        HttpContextAccessor.Object,
        UserService.Object,
        BlockReasonService.Object,
        LinkMaintenanceService.Object,
        NotificationDeliveryService.Object,
        ExecutionStrategyService.Object,
        BlockRequestValidator.Object,
        UnblockRequestValidator.Object,
        BlockRepository.Object);
    }
    #endregion

    #region Private Members
    private static void SetupRepository<T>(Mock<IRepository<T>> mock) where T : class
    {
      var empty = new List<T>().AsQueryable();

      mock.Setup(r => r.Query()).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<LockMode>())).Returns(empty);

      mock.Setup(r => r.Create(It.IsAny<T>())).ReturnsAsync((T item) => item);
      mock.Setup(r => r.Update(It.IsAny<T>())).ReturnsAsync((T item) => item);
    }
    #endregion
  }
}
