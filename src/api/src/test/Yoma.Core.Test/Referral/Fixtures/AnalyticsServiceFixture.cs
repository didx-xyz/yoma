using Microsoft.AspNetCore.Http;
using Moq;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Services;
using Yoma.Core.Domain.Referral.Validators;

namespace Yoma.Core.Test.Referral.Fixtures
{
  public class AnalyticsServiceFixture
  {
    #region Public Properties – Mocks
    public Mock<IHttpContextAccessor> HttpContextAccessor { get; }
    public Mock<IUserService> UserService { get; }
    public Mock<ILinkStatusService> LinkStatusService { get; }
    public Mock<ILinkUsageStatusService> LinkUsageStatusService { get; }
    public Mock<ReferralAnalyticsSearchFilterValidator> ReferralAnalyticsSearchFilterValidator { get; }
    public Mock<IRepositoryBatched<ReferralLinkUsage>> LinkUsageRepository { get; }
    public Mock<IRepositoryBatchedValueContainsWithNavigation<ReferralLink>> LinkRepository { get; }
    #endregion

    #region Constructor
    public AnalyticsServiceFixture(string username = "testuser@example.com", params string[] roles)
    {
      HttpContextAccessor = MockHttpContextAccessor.Create(username, roles);

      UserService = new Mock<IUserService>();
      LinkStatusService = MockLookupServices.CreateLinkStatusService();
      LinkUsageStatusService = MockLookupServices.CreateLinkUsageStatusService();

      ReferralAnalyticsSearchFilterValidator = new Mock<ReferralAnalyticsSearchFilterValidator>() { CallBase = false };

      LinkUsageRepository = new Mock<IRepositoryBatched<ReferralLinkUsage>>();
      SetupBatchedRepository(LinkUsageRepository);

      LinkRepository = new Mock<IRepositoryBatchedValueContainsWithNavigation<ReferralLink>>();
      SetupBatchedNavRepository(LinkRepository);
    }
    #endregion

    #region Public Members
    public AnalyticsService Build()
    {
      return new AnalyticsService(
        HttpContextAccessor.Object,
        UserService.Object,
        LinkStatusService.Object,
        LinkUsageStatusService.Object,
        ReferralAnalyticsSearchFilterValidator.Object,
        LinkUsageRepository.Object,
        LinkRepository.Object);
    }
    #endregion

    #region Private Members
    private static void SetupBatchedRepository<T>(Mock<IRepositoryBatched<T>> mock) where T : class
    {
      var empty = new List<T>().AsQueryable();

      mock.Setup(r => r.Query()).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<LockMode>())).Returns(empty);

      mock.Setup(r => r.Create(It.IsAny<T>())).ReturnsAsync((T item) => item);
      mock.Setup(r => r.Update(It.IsAny<T>())).ReturnsAsync((T item) => item);
      mock.Setup(r => r.Create(It.IsAny<List<T>>())).ReturnsAsync((List<T> items) => items);
      mock.Setup(r => r.Update(It.IsAny<List<T>>())).ReturnsAsync((List<T> items) => items);
    }

    private static void SetupBatchedNavRepository<T>(Mock<IRepositoryBatchedValueContainsWithNavigation<T>> mock) where T : class
    {
      var empty = new List<T>().AsQueryable();

      mock.Setup(r => r.Query()).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<LockMode>())).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<bool>())).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<bool>(), It.IsAny<LockMode>())).Returns(empty);

      mock.Setup(r => r.Create(It.IsAny<T>())).ReturnsAsync((T item) => item);
      mock.Setup(r => r.Update(It.IsAny<T>())).ReturnsAsync((T item) => item);
      mock.Setup(r => r.Create(It.IsAny<List<T>>())).ReturnsAsync((List<T> items) => items);
      mock.Setup(r => r.Update(It.IsAny<List<T>>())).ReturnsAsync((List<T> items) => items);
    }
    #endregion
  }
}
