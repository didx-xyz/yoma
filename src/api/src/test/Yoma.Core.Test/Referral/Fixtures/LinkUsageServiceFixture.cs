using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Services;
using Yoma.Core.Domain.Referral.Validators;
using Yoma.Core.Domain.Reward.Interfaces;

namespace Yoma.Core.Test.Referral.Fixtures
{
  public class LinkUsageServiceFixture
  {
    #region Public Properties – Mocks
    public Mock<ILogger<LinkUsageService>> Logger { get; }
    public Mock<IOptions<AppSettings>> AppSettingsOptions { get; }
    public AppSettings AppSettings { get; }
    public Mock<IHttpContextAccessor> HttpContextAccessor { get; }
    public Mock<IProgramService> ProgramService { get; }
    public Mock<ILinkUsageStatusService> LinkUsageStatusService { get; }
    public Mock<IUserService> UserService { get; }
    public Mock<IMyOpportunityService> MyOpportunityService { get; }
    public Mock<ILinkService> LinkService { get; }
    public Mock<IRewardService> RewardService { get; }
    public Mock<IDistributedLockService> DistributedLockService { get; }
    public Mock<IExecutionStrategyService> ExecutionStrategyService { get; }
    public Mock<INotificationDeliveryService> NotificationDeliveryService { get; }
    public Mock<INotificationURLFactory> NotificationURLFactory { get; }
    public Mock<ICountryService> CountryService { get; }
    public Mock<ReferralLinkUsageSearchFilterValidator> ReferralLinkUsageSearchFilterValidator { get; }
    public Mock<IRepositoryBatched<ReferralLinkUsage>> LinkUsageRepository { get; }
    #endregion

    #region Constructor
    public LinkUsageServiceFixture(string username = "testuser@example.com", params string[] roles)
    {
      Logger = new Mock<ILogger<LinkUsageService>>();

      AppSettings = new AppSettings
      {
        AppBaseURL = "https://app.test.com",
        ReferralRestrictRefereeToSingleProgram = false,
        ReferralFirstClaimSinceYoIDOnboardedTimeoutInHours = 8760, // 1 year — effectively disables the "already registered" check for tests
        DistributedLockReferralProgressDurationInSeconds = 60
      };
      AppSettingsOptions = new Mock<IOptions<AppSettings>>();
      AppSettingsOptions.Setup(x => x.Value).Returns(AppSettings);

      HttpContextAccessor = MockHttpContextAccessor.Create(username, roles);

      ProgramService = new Mock<IProgramService>();
      LinkUsageStatusService = MockLookupServices.CreateLinkUsageStatusService();
      UserService = new Mock<IUserService>();
      MyOpportunityService = new Mock<IMyOpportunityService>();
      LinkService = new Mock<ILinkService>();
      RewardService = new Mock<IRewardService>();

      DistributedLockService = new Mock<IDistributedLockService>();
      DistributedLockService
        .Setup(x => x.RunWithLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<Func<Task>>(), It.IsAny<string>()))
        .Returns<string, TimeSpan, Func<Task>, string>(async (_, _, action, _) => await action());

      ExecutionStrategyService = new Mock<IExecutionStrategyService>();
      ExecutionStrategyService
        .Setup(x => x.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>()))
        .Returns<Func<Task>>(async action => await action());
      ExecutionStrategyService
        .Setup(x => x.ExecuteInExecutionStrategy(It.IsAny<Action>()))
        .Callback<Action>(action => action());

      NotificationDeliveryService = new Mock<INotificationDeliveryService>();
      NotificationURLFactory = new Mock<INotificationURLFactory>();
      CountryService = new Mock<ICountryService>();

      ReferralLinkUsageSearchFilterValidator = new Mock<ReferralLinkUsageSearchFilterValidator>() { CallBase = false };

      LinkUsageRepository = new Mock<IRepositoryBatched<ReferralLinkUsage>>();
      SetupRepository(LinkUsageRepository);
    }
    #endregion

    #region Public Members
    public LinkUsageService Build()
    {
      return new LinkUsageService(
        Logger.Object,
        AppSettingsOptions.Object,
        HttpContextAccessor.Object,
        ProgramService.Object,
        LinkUsageStatusService.Object,
        UserService.Object,
        MyOpportunityService.Object,
        LinkService.Object,
        RewardService.Object,
        DistributedLockService.Object,
        ExecutionStrategyService.Object,
        NotificationDeliveryService.Object,
        NotificationURLFactory.Object,
        CountryService.Object,
        ReferralLinkUsageSearchFilterValidator.Object,
        LinkUsageRepository.Object);
    }
    #endregion

    #region Private Members
    private static void SetupRepository<T>(Mock<IRepositoryBatched<T>> mock) where T : class
    {
      var empty = new List<T>().AsQueryable();

      mock.Setup(r => r.Query()).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<LockMode>())).Returns(empty);

      mock.Setup(r => r.Create(It.IsAny<T>())).ReturnsAsync((T item) => item);
      mock.Setup(r => r.Update(It.IsAny<T>())).ReturnsAsync((T item) => item);
      mock.Setup(r => r.Create(It.IsAny<List<T>>())).ReturnsAsync((List<T> items) => items);
      mock.Setup(r => r.Update(It.IsAny<List<T>>())).ReturnsAsync((List<T> items) => items);
    }
    #endregion
  }
}
